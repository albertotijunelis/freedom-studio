// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import Database from 'better-sqlite3-multiple-ciphers';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, chmodSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { app } from 'electron';
import { randomUUID, randomBytes } from 'node:crypto';
import type { Conversation, Message, SystemPrompt, Persona, Role } from '@freedom-studio/types';
import { cryptoManager } from '../crypto/cryptoManager';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    model_id TEXT NOT NULL DEFAULT '',
    system_prompt TEXT NOT NULL DEFAULT '',
    persona_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

  CREATE TABLE IF NOT EXISTS system_prompts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    system_prompt TEXT NOT NULL DEFAULT '',
    avatar_emoji TEXT NOT NULL DEFAULT '🤖',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    key_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_used_at INTEGER,
    expires_at INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

export class DatabaseManager {
  private db: Database.Database | null = null;

  initialize(): void {
    const userDataPath = app?.getPath?.('userData') || join(process.env.APPDATA || process.env.HOME || '', 'freedom-studio');
    const dbDir = join(userDataPath, 'data');
    const cryptoDir = join(userDataPath, 'crypto');
    mkdirSync(dbDir, { recursive: true });
    mkdirSync(cryptoDir, { recursive: true });

    const dbPath = join(dbDir, 'freedom-studio.db');
    const dbKeyPath = join(cryptoDir, 'dbkey');
    const dbKey = this.getOrCreateDbKey(dbKeyPath);
    const isNewDb = !existsSync(dbPath);

    this.db = new Database(dbPath);
    this.applyCipher(dbKey);

    if (!isNewDb) {
      // Verify cipher works — throws if key mismatch or DB was unencrypted
      try {
        this.db.prepare('SELECT count(*) FROM sqlite_master').get();
      } catch {
        // Existing unencrypted DB from a previous version — backup and recreate
        console.warn('[DB] Database is not encrypted or key mismatch. Backing up and recreating...');
        this.db.close();
        const backupPath = dbPath + '.v2-backup-' + Date.now();
        renameSync(dbPath, backupPath);
        console.warn('[DB] Old database backed up to:', backupPath);

        this.db = new Database(dbPath);
        this.applyCipher(dbKey);
      }
    }

    // Enable WAL mode for better concurrent performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.db.exec(SCHEMA);
    this.seedDefaults();
    console.log('[DB] SQLCipher-encrypted database initialized');
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // ─── Conversations ───

  createConversation(title: string, modelId = '', systemPrompt = ''): Conversation {
    const now = Date.now();
    const id = randomUUID();
    const encryptedPrompt = systemPrompt ? this.encryptField(systemPrompt) : '';

    this.getDb().prepare(
      'INSERT INTO conversations (id, title, model_id, system_prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, title, modelId, encryptedPrompt, now, now);

    return { id, title, modelId, systemPrompt, personaId: null, createdAt: now, updatedAt: now, messageCount: 0, totalTokens: 0 };
  }

  getConversation(id: string): Conversation | null {
    const row = this.getDb().prepare('SELECT * FROM conversations WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? this.mapConversation(row) : null;
  }

  listConversations(limit = 50, offset = 0): Conversation[] {
    const rows = this.getDb().prepare(
      'SELECT * FROM conversations ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset) as Record<string, unknown>[];

    return rows.map((r) => this.mapConversation(r));
  }

  updateConversation(id: string, updates: Partial<Pick<Conversation, 'title' | 'systemPrompt'>>): void {
    const sets: string[] = ['updated_at = ?'];
    const values: unknown[] = [Date.now()];

    if (updates.title !== undefined) {
      sets.push('title = ?');
      values.push(updates.title);
    }
    if (updates.systemPrompt !== undefined) {
      sets.push('system_prompt = ?');
      values.push(updates.systemPrompt ? this.encryptField(updates.systemPrompt) : '');
    }

    values.push(id);
    this.getDb().prepare(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  }

  deleteConversation(id: string): void {
    this.getDb().prepare('DELETE FROM conversations WHERE id = ?').run(id);
  }

  // ─── Messages ───

  addMessage(conversationId: string, role: Role, content: string, tokenCount = 0): Message {
    const id = randomUUID();
    const now = Date.now();
    const encryptedContent = this.encryptField(content);

    const db = this.getDb();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, created_at, token_count) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, conversationId, role, encryptedContent, now, tokenCount);

    db.prepare(
      'UPDATE conversations SET updated_at = ?, message_count = message_count + 1, total_tokens = total_tokens + ? WHERE id = ?'
    ).run(now, tokenCount, conversationId);

    return { id, conversationId, role, content, createdAt: now, tokenCount };
  }

  getMessages(conversationId: string, limit = 100, offset = 0): Message[] {
    const rows = this.getDb().prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?'
    ).all(conversationId, limit, offset) as Record<string, unknown>[];

    return rows.map((r) => this.mapMessage(r));
  }

  deleteMessage(id: string): void {
    this.getDb().prepare('DELETE FROM messages WHERE id = ?').run(id);
  }

  // ─── System Prompts ───

  createSystemPrompt(name: string, content: string, isDefault = false): SystemPrompt {
    const id = randomUUID();
    const now = Date.now();
    const encryptedContent = this.encryptField(content);

    this.getDb().prepare(
      'INSERT INTO system_prompts (id, name, content, is_default, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name, encryptedContent, isDefault ? 1 : 0, now);

    return { id, name, content, isDefault, createdAt: now };
  }

  listSystemPrompts(): SystemPrompt[] {
    const rows = this.getDb().prepare('SELECT * FROM system_prompts ORDER BY created_at DESC').all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      content: this.decryptField(r.content as string),
      isDefault: r.is_default === 1,
      createdAt: r.created_at as number,
    }));
  }

  deleteSystemPrompt(id: string): void {
    this.getDb().prepare('DELETE FROM system_prompts WHERE id = ?').run(id);
  }

  // ─── Settings ───

  getSetting(key: string): string | null {
    const row = this.getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  setSetting(key: string, value: string): void {
    this.getDb().prepare(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
    ).run(key, value);
  }

  // ─── Internals ───

  private getDb(): Database.Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  /** Apply SQLCipher encryption to the open database connection. */
  private applyCipher(hexKey: string): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.pragma("cipher='sqlcipher'");
    this.db.pragma("legacy=4");
    this.db.pragma(`key="x'${hexKey}'"`);
  }

  /** Read or generate the 256-bit database encryption key. */
  private getOrCreateDbKey(keyPath: string): string {
    if (existsSync(keyPath)) {
      return readFileSync(keyPath, 'utf-8').trim();
    }
    const key = randomBytes(32).toString('hex');
    writeFileSync(keyPath, key, { encoding: 'utf-8', mode: 0o600 });

    // On Windows, POSIX mode flags are ignored. Use icacls to restrict to current user only.
    if (process.platform === 'win32') {
      try {
        const username = process.env.USERNAME || '';
        if (username) {
          execSync(`icacls "${keyPath}" /inheritance:r /grant:r "${username}:(R,W)" /deny "Everyone:(R,W,D)"`, { stdio: 'ignore' });
        }
      } catch {
        console.warn('[DB] Could not restrict key file permissions via icacls');
      }
    } else {
      // Enforce POSIX permissions (redundant with writeFileSync mode, but explicit)
      chmodSync(keyPath, 0o600);
    }

    return key;
  }

  /** Encrypt a string if the crypto manager is unlocked; otherwise store as-is. */
  private encryptField(plaintext: string): string {
    if (!cryptoManager.isUnlocked()) return plaintext;
    try {
      const payload = cryptoManager.encryptData(plaintext);
      return `ENC:${JSON.stringify(payload)}`;
    } catch {
      return plaintext;
    }
  }

  /** Decrypt a string if it was encrypted; otherwise return as-is. */
  private decryptField(stored: string): string {
    if (!stored.startsWith('ENC:')) return stored;
    if (!cryptoManager.isUnlocked()) return '[encrypted — unlock with master password]';
    try {
      const payload = JSON.parse(stored.slice(4));
      return cryptoManager.decryptData(payload);
    } catch {
      return '[decryption failed]';
    }
  }

  private seedDefaults(): void {
    const count = this.getDb().prepare('SELECT COUNT(*) as c FROM system_prompts').get() as { c: number };
    if (count.c === 0) {
      this.createSystemPrompt('Default Assistant', 'You are a helpful AI assistant.', true);
      this.createSystemPrompt('Coding Expert', 'You are an expert programmer. Provide clear, concise code with explanations.', false);
      this.createSystemPrompt('Creative Writer', 'You are a creative writer. Be imaginative and expressive.', false);
    }
  }

  private mapConversation(row: Record<string, unknown>): Conversation {
    return {
      id: row.id as string,
      title: row.title as string,
      modelId: row.model_id as string,
      systemPrompt: this.decryptField(row.system_prompt as string),
      personaId: (row.persona_id as string) || null,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
      messageCount: row.message_count as number,
      totalTokens: row.total_tokens as number,
    };
  }

  private mapMessage(row: Record<string, unknown>): Message {
    return {
      id: row.id as string,
      conversationId: row.conversation_id as string,
      role: row.role as Role,
      content: this.decryptField(row.content as string),
      createdAt: row.created_at as number,
      tokenCount: row.token_count as number,
    };
  }
}

export const databaseManager = new DatabaseManager();
