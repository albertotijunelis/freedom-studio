// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useInferenceStore } from '../stores/inferenceStore';
import type { Conversation, Message } from '@freedom-studio/types';

/* ── Conversation List (left panel) ── */
function ConversationList(): React.JSX.Element {
  const { conversations, activeConversationId, setActiveConversation, createConversation, deleteConversation, fetchConversations } = useChatStore();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) return;
    await createConversation(newTitle.trim());
    setNewTitle('');
    setCreating(false);
  }, [newTitle, createConversation]);

  return (
    <div
      className="flex flex-col h-full border-r"
      style={{
        width: 260,
        borderColor: 'var(--border-subtle)',
        background: 'var(--bg-dark)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
          Conversations
        </span>
        <button
          onClick={() => setCreating(!creating)}
          className="text-xs px-2 py-1 rounded cursor-pointer hover:bg-white/5 transition-colors"
          style={{ color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          + New
        </button>
      </div>

      {/* New conversation form */}
      {creating && (
        <div className="p-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Conversation name..."
            autoFocus
            className="w-full px-2 py-1.5 rounded text-xs outline-none"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-accent)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
              No conversations yet
            </span>
          </div>
        ) : (
          conversations.map((conv: Conversation) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveConversation(conv.id)}
              className="w-full text-left px-3 py-2.5 border-b transition-colors cursor-pointer group"
              style={{
                borderColor: 'var(--border-subtle)',
                background: activeConversationId === conv.id ? 'rgba(0, 255, 136, 0.06)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs truncate"
                  style={{
                    color: activeConversationId === conv.id ? 'var(--accent-green)' : 'var(--text-primary)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {conv.title}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 text-xs px-1 cursor-pointer transition-opacity"
                  style={{ color: 'var(--accent-red)' }}
                >
                  ×
                </button>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                {conv.messageCount} messages
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Message Bubble ── */
function MessageBubble({ message }: { message: Message }): React.JSX.Element {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className="max-w-[80%] px-4 py-3 rounded-lg"
        style={{
          background: isUser ? 'rgba(0, 255, 136, 0.08)' : 'var(--bg-surface)',
          border: `1px solid ${isUser ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        }}
      >
        {/* Role label */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase" style={{
            color: isUser ? 'var(--accent-green)' : 'var(--accent-cyan)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
          }}>
            {message.role}
          </span>
        </div>

        {/* Content */}
        <div
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            color: 'var(--text-primary)',
            fontFamily: message.role === 'assistant' ? "'Inter', sans-serif" : "'JetBrains Mono', monospace",
          }}
        >
          {message.content}
        </div>

        {/* Token count */}
        {message.tokenCount > 0 && (
          <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
            {message.tokenCount} tokens
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Streaming Message ── */
function StreamingMessage({ content }: { content: string }): React.JSX.Element {
  return (
    <div className="flex justify-start mb-3">
      <div
        className="max-w-[80%] px-4 py-3 rounded-lg"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase" style={{
            color: 'var(--accent-cyan)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
          }}>
            assistant
          </span>
          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-green)' }} />
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}>
          {content || '...'}
        </div>
      </div>
    </div>
  );
}

/* ── Chat Input ── */
function ChatInput({ onSend, disabled }: { onSend: (msg: string) => void; disabled: boolean }): React.JSX.Element {
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  }, [input, disabled, onSend]);

  return (
    <div className="border-t p-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-dark)' }}>
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={disabled ? 'Load a model first...' : 'Type a message...'}
          disabled={disabled}
          rows={2}
          className="flex-1 px-3 py-2 rounded text-sm resize-none outline-none custom-scrollbar"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer transition-all"
          style={{
            background: disabled || !input.trim() ? 'var(--bg-surface)' : 'rgba(0, 255, 136, 0.15)',
            color: disabled || !input.trim() ? 'var(--text-muted)' : 'var(--accent-green)',
            border: `1px solid ${disabled || !input.trim() ? 'var(--border-subtle)' : 'var(--border-accent)'}`,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ── Main Chat Page ── */
export function ChatPage(): React.JSX.Element {
  const { messages, activeConversationId, addMessage } = useChatStore();
  const { loadedModel, isRunning, currentTokens, tokensPerSecond } = useInferenceStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTokens]);

  const handleSend = useCallback(async (content: string) => {
    if (!activeConversationId) return;

    // Add user message
    await addMessage('user', content);

    // Trigger inference
    try {
      const inferenceStore = useInferenceStore.getState();
      await inferenceStore.runInference(content);

      // After inference completes, save assistant message
      const finalTokens = useInferenceStore.getState().currentTokens;
      if (finalTokens) {
        await addMessage('assistant', finalTokens);
      }
    } catch {
      // Inference error handled in store
    }
  }, [activeConversationId, addMessage]);

  return (
    <div className="flex h-full">
      {/* Conversation sidebar */}
      <ConversationList />

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {!activeConversationId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Select or create a conversation to begin
                </p>
              </div>
            </div>
          ) : messages.length === 0 && !isRunning ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                Start typing to chat with the model
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg: Message) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isRunning && <StreamingMessage content={currentTokens} />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Token stats bar */}
        {(isRunning || tokensPerSecond > 0) && (
          <div className="px-4 py-1 border-t flex items-center gap-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-dark)' }}>
            <span className="text-xs" style={{ color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}>
              {tokensPerSecond.toFixed(1)} tok/s
            </span>
            {isRunning && (
              <span className="text-xs" style={{ color: 'var(--accent-yellow)', fontFamily: "'JetBrains Mono', monospace" }}>
                generating...
              </span>
            )}
          </div>
        )}

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={!loadedModel || !activeConversationId} />
      </div>
    </div>
  );
}
