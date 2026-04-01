// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { createServer as createHttpsServer, type Server as HttpsServer } from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inferenceEngine } from '../inference/engine';
import type { ChatMessage } from '../inference/engine';
import type { RequestLog } from '@freedom-studio/types';

interface ServerOptions {
  port: number;
  certPem?: string;
  keyPem?: string;
  certPath?: string;
  keyPath?: string;
  apiKeys: string[];
  mtlsEnabled?: boolean;
  caCertPath?: string;
}

export class APIServer {
  private server: HttpsServer | null = null;
  private port = 0;
  private apiKeys: Set<string> = new Set();
  private requestLogs: RequestLog[] = [];
  private isRunning = false;
  private startTime = 0;
  private totalRequests = 0;

  async start(options: ServerOptions): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    const tlsOptions: Record<string, unknown> = {
      cert: options.certPem || (options.certPath ? readFileSync(options.certPath, 'utf-8') : undefined),
      key: options.keyPem || (options.keyPath ? readFileSync(options.keyPath, 'utf-8') : undefined),
    };

    if (!tlsOptions.cert || !tlsOptions.key) {
      throw new Error('TLS certificate and key are required');
    }

    if (options.mtlsEnabled && options.caCertPath) {
      tlsOptions.ca = readFileSync(options.caCertPath, 'utf-8');
      tlsOptions.requestCert = true;
      tlsOptions.rejectUnauthorized = true;
    }

    this.port = options.port;
    this.apiKeys = new Set(options.apiKeys);

    this.server = createHttpsServer(tlsOptions, (req, res) => {
      this.handleRequest(req, res).catch((err) => {
        this.sendError(res, 500, `Internal server error: ${err instanceof Error ? err.message : 'Unknown'}`);
      });
    });

    return new Promise((resolve, reject) => {
      this.server!.listen(this.port, '127.0.0.1', () => {
        this.isRunning = true;
        this.startTime = Date.now();
        // Update port to the actual assigned port (important when port 0 is used)
        const addr = this.server!.address();
        if (addr && typeof addr === 'object') {
          this.port = addr.port;
        }
        resolve();
      });
      this.server!.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    if (!this.server || !this.isRunning) return;

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.isRunning = false;
        this.server = null;
        resolve();
      });
    });
  }

  getStatus(): { running: boolean; port: number; uptime: number; totalRequests: number } {
    return {
      running: this.isRunning,
      port: this.port,
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      totalRequests: this.totalRequests,
    };
  }

  getRequestLogs(): RequestLog[] {
    return this.requestLogs.slice(-1000);
  }

  updateApiKeys(keys: string[]): void {
    this.apiKeys = new Set(keys);
  }

  private verifyApiKey(candidate: string): boolean {
    const candidateBuf = Buffer.from(candidate);
    for (const key of this.apiKeys) {
      const keyBuf = Buffer.from(key);
      if (candidateBuf.length === keyBuf.length && timingSafeEqual(candidateBuf, keyBuf)) {
        return true;
      }
    }
    return false;
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const startTime = Date.now();
    this.totalRequests++;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://localhost');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // API key auth
    if (this.apiKeys.size > 0) {
      const authHeader = req.headers.authorization;
      const apiKey = authHeader?.replace('Bearer ', '');

      if (!apiKey || !this.verifyApiKey(apiKey)) {
        this.sendError(res, 401, 'Invalid API key');
        return;
      }
    }

    const url = req.url || '';

    if (req.method === 'GET' && url === '/v1/models') {
      await this.handleListModels(res);
    } else if (req.method === 'POST' && url === '/v1/chat/completions') {
      const body = await this.readBody(req);
      await this.handleChatCompletions(body, res, startTime);
    } else if (req.method === 'POST' && url === '/v1/completions') {
      const body = await this.readBody(req);
      await this.handleCompletions(body, res, startTime);
    } else {
      this.sendError(res, 404, 'Not found');
    }
  }

  private async handleListModels(res: ServerResponse): Promise<void> {
    const loaded = inferenceEngine.getIsLoaded();
    const modelPath = inferenceEngine.getCurrentModelPath();

    res.writeHead(200);
    res.end(JSON.stringify({
      object: 'list',
      data: loaded ? [{
        id: modelPath,
        object: 'model',
        created: Date.now(),
        owned_by: 'local',
      }] : [],
    }));
  }

  private async handleChatCompletions(body: string, res: ServerResponse, startTime: number): Promise<void> {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(body);
    } catch {
      this.sendError(res, 400, 'Invalid JSON');
      return;
    }

    if (!inferenceEngine.getIsLoaded()) {
      this.sendError(res, 503, 'No model loaded');
      return;
    }

    const messages = parsed.messages as Array<{ role: string; content: string }>;
    if (!Array.isArray(messages) || messages.length === 0) {
      this.sendError(res, 400, 'messages is required');
      return;
    }

    // Map messages to ChatMessage format for context-aware inference
    const chatMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    const inferenceParams = {
      temperature: Number(parsed.temperature ?? 0.7),
      topP: Number(parsed.top_p ?? 0.9),
      topK: Number(parsed.top_k ?? 40),
      repeatPenalty: Number(parsed.repeat_penalty ?? 1.1),
      maxTokens: Number(parsed.max_tokens ?? 2048),
      stop: (parsed.stop as string[]) || [],
    };

    const stream = parsed.stream === true;

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const completionId = `chatcmpl-${randomUUID()}`;

      try {
        await inferenceEngine.streamWithHistory(chatMessages, inferenceParams, (token, done) => {
          if (done) {
            res.write(`data: [DONE]\n\n`);
            res.end();
          } else {
            const chunk = {
              id: completionId,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: inferenceEngine.getCurrentModelPath(),
              choices: [{
                index: 0,
                delta: { content: token },
                finish_reason: null,
              }],
            };
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
        });
        this.logRequest('POST', '/v1/chat/completions', Date.now() - startTime, 200);
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
        res.end();
        this.logRequest('POST', '/v1/chat/completions', Date.now() - startTime, 500);
      }
    } else {
      try {
        // For non-streaming, collect all tokens from streamWithHistory
        let fullResult = '';
        await inferenceEngine.streamWithHistory(chatMessages, inferenceParams, (token, done) => {
          if (!done) fullResult += token;
        });
        const latencyMs = Date.now() - startTime;

        const response = {
          id: `chatcmpl-${randomUUID()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: inferenceEngine.getCurrentModelPath(),
          choices: [{
            index: 0,
            message: { role: 'assistant', content: fullResult },
            finish_reason: 'stop',
          }],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        };

        this.logRequest('POST', '/v1/chat/completions', latencyMs, 200);

        res.writeHead(200);
        res.end(JSON.stringify(response));
      } catch (error) {
        this.sendError(res, 500, error instanceof Error ? error.message : 'Inference failed');
      }
    }
  }

  private async handleCompletions(body: string, res: ServerResponse, startTime: number): Promise<void> {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(body);
    } catch {
      this.sendError(res, 400, 'Invalid JSON');
      return;
    }

    if (!inferenceEngine.getIsLoaded()) {
      this.sendError(res, 503, 'No model loaded');
      return;
    }

    const prompt = parsed.prompt as string;
    if (!prompt) {
      this.sendError(res, 400, 'prompt is required');
      return;
    }

    const inferenceParams = {
      temperature: Number(parsed.temperature ?? 0.7),
      topP: Number(parsed.top_p ?? 0.9),
      topK: Number(parsed.top_k ?? 40),
      repeatPenalty: Number(parsed.repeat_penalty ?? 1.1),
      maxTokens: Number(parsed.max_tokens ?? 2048),
      stop: (parsed.stop as string[]) || [],
    };

    try {
      const result = await inferenceEngine.run(prompt, inferenceParams);
      const latencyMs = Date.now() - startTime;

      this.logRequest('POST', '/v1/completions', latencyMs, 200);

      res.writeHead(200);
      res.end(JSON.stringify({
        id: `cmpl-${randomUUID()}`,
        object: 'text_completion',
        created: Math.floor(Date.now() / 1000),
        model: inferenceEngine.getCurrentModelPath(),
        choices: [{
          text: result,
          index: 0,
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      }));
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : 'Inference failed');
    }
  }

  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let size = 0;
      const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB

      req.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_BODY_SIZE) {
          reject(new Error('Request body too large'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      req.on('error', reject);
    });
  }

  private sendError(res: ServerResponse, status: number, message: string): void {
    res.writeHead(status);
    res.end(JSON.stringify({ error: { message, type: 'server_error', code: status } }));
  }

  private logRequest(method: string, endpoint: string, latencyMs: number, statusCode: number): void {
    const log: RequestLog = {
      id: randomUUID(),
      timestamp: Date.now(),
      method,
      endpoint,
      model: inferenceEngine.getCurrentModelPath(),
      promptTokens: 0,
      completionTokens: 0,
      latencyMs,
      statusCode,
      clientIp: '127.0.0.1',
      apiKeyId: '',
    };

    this.requestLogs.push(log);

    // Keep only last 1000 logs
    if (this.requestLogs.length > 1000) {
      this.requestLogs = this.requestLogs.slice(-1000);
    }
  }
}

export const apiServer = new APIServer();
