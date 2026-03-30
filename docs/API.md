# Freedom Studio — Local API Reference

> Copyright (C) 2026 Alberto Tijunelis Neto. Licensed under GPL-3.0-or-later.

## Overview

Freedom Studio provides an OpenAI-compatible HTTPS API server running on localhost. All communication is encrypted via TLS with self-signed certificates.

## Base URL

```
https://localhost:8080/v1
```

Port is configurable in Settings or when starting the server.

## Authentication

All requests require an API key in the `Authorization` header:

```
Authorization: Bearer fs-<your-api-key>
```

Generate API keys in the API Server page of the application.

## Endpoints

### POST /v1/chat/completions

Chat completion with messages array. Supports streaming via SSE.

**Request:**
```json
{
  "model": "model-name",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false
}
```

**Response (non-streaming):**
```json
{
  "id": "chatcmpl-<uuid>",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "model-name",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 8,
    "total_tokens": 18
  }
}
```

**Response (streaming):** Server-Sent Events with `data: {...}` lines.

### POST /v1/completions

Text completion (non-chat format).

**Request:**
```json
{
  "model": "model-name",
  "prompt": "Once upon a time",
  "temperature": 0.7,
  "max_tokens": 256
}
```

### GET /v1/models

Lists available models.

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "model-name",
      "object": "model",
      "owned_by": "local"
    }
  ]
}
```

## TLS Certificate

On first server start, Freedom Studio generates a self-signed TLS certificate stored in your app data directory. Clients connecting to the API will need to either:
- Trust the self-signed certificate
- Use `--insecure` / disable certificate verification for localhost

## Error Responses

```json
{
  "error": {
    "message": "Description of the error",
    "type": "invalid_request_error",
    "code": 400
  }
}
```

| Code | Meaning |
|---|---|
| 401 | Invalid or missing API key |
| 404 | Endpoint not found |
| 500 | Internal server error |
| 503 | No model loaded |
