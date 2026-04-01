// Freedom Studio — Copyright (C) 2026 Alberto Tijunelis Neto <albertotijunelis@gmail.com>
// SPDX-License-Identifier: GPL-3.0-or-later

import { useState, useRef, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../stores/chatStore';
import { useInferenceStore } from '../stores/inferenceStore';
import type { Conversation, Message, SystemPrompt } from '@freedom-studio/types';

/* ── Conversation List (left panel) ── */
function ConversationList(): React.JSX.Element {
  const { conversations, activeConversationId, setActiveConversation, createConversation, deleteConversation, fetchConversations, fetchSystemPrompts, systemPrompts } = useChatStore();
  const { isRunning, inferenceConversationId } = useInferenceStore();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');

  useEffect(() => {
    fetchConversations();
    fetchSystemPrompts();
  }, [fetchConversations, fetchSystemPrompts]);

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) return;
    const prompt = systemPrompts.find((p) => p.id === selectedPrompt);
    await createConversation(newTitle.trim(), prompt?.content);
    setNewTitle('');
    setSelectedPrompt('');
    setCreating(false);
  }, [newTitle, selectedPrompt, systemPrompts, createConversation]);

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
        <div className="p-2 border-b space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
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
          {systemPrompts.length > 0 && (
            <select
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value)}
              className="w-full px-2 py-1.5 rounded text-xs outline-none cursor-pointer"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <option value="">No system prompt</option>
              {systemPrompts.map((sp: SystemPrompt) => (
                <option key={sp.id} value={sp.id}>{sp.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim()}
            className="w-full px-2 py-1.5 rounded text-xs cursor-pointer transition-all"
            style={{
              background: 'rgba(0, 255, 136, 0.12)',
              color: 'var(--accent-green)',
              border: '1px solid var(--border-accent)',
              fontFamily: "'JetBrains Mono', monospace",
              opacity: newTitle.trim() ? 1 : 0.5,
            }}
          >
            Create
          </button>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') setActiveConversation(conv.id);
              }}
              className="w-full text-left px-3 py-2.5 border-b transition-colors group"
              style={{
                borderColor: 'var(--border-subtle)',
                background: activeConversationId === conv.id ? 'rgba(0, 255, 136, 0.06)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isRunning && inferenceConversationId === conv.id && (
                    <span className="inline-block w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
                  )}
                  <span
                    className="text-xs truncate"
                    style={{
                      color: activeConversationId === conv.id ? 'var(--accent-green)' : 'var(--text-primary)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {conv.title}
                  </span>
                </div>
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

/* ── Code Block with copy button ── */
function CodeBlock({ children, className }: { children: string; className?: string }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') || '';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div className="relative my-2 rounded overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center justify-between px-3 py-1 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-dark)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-0.5 cursor-pointer hover:bg-white/5 rounded transition-colors"
          style={{ color: copied ? 'var(--accent-green)' : 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs leading-relaxed" style={{ fontFamily: "'Fira Code', monospace", color: 'var(--text-code)' }}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

/* ── Markdown renderer components ── */
const markdownComponents = {
  code({ children, className }: { children?: React.ReactNode; className?: string }) {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>;
    }
    return (
      <code
        className="px-1.5 py-0.5 rounded text-xs"
        style={{ background: 'rgba(0, 255, 136, 0.08)', color: 'var(--text-code)', fontFamily: "'Fira Code', monospace" }}
      >
        {children}
      </code>
    );
  },
  pre({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  },
  p({ children }: { children?: React.ReactNode }) {
    return <p className="mb-2 last:mb-0">{children}</p>;
  },
  ul({ children }: { children?: React.ReactNode }) {
    return <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>;
  },
  ol({ children }: { children?: React.ReactNode }) {
    return <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>;
  },
  h1({ children }: { children?: React.ReactNode }) {
    return <h1 className="text-lg font-bold mb-2 mt-3" style={{ color: 'var(--accent-green)' }}>{children}</h1>;
  },
  h2({ children }: { children?: React.ReactNode }) {
    return <h2 className="text-base font-bold mb-2 mt-3" style={{ color: 'var(--accent-green)' }}>{children}</h2>;
  },
  h3({ children }: { children?: React.ReactNode }) {
    return <h3 className="text-sm font-bold mb-1.5 mt-2" style={{ color: 'var(--accent-green)' }}>{children}</h3>;
  },
  blockquote({ children }: { children?: React.ReactNode }) {
    return (
      <blockquote className="border-l-2 pl-3 my-2" style={{ borderColor: 'var(--accent-cyan)', color: 'var(--text-secondary)' }}>
        {children}
      </blockquote>
    );
  },
  table({ children }: { children?: React.ReactNode }) {
    return <table className="border-collapse my-2 w-full text-xs" style={{ border: '1px solid var(--border-subtle)' }}>{children}</table>;
  },
  th({ children }: { children?: React.ReactNode }) {
    return <th className="px-2 py-1.5 text-left" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}>{children}</th>;
  },
  td({ children }: { children?: React.ReactNode }) {
    return <td className="px-2 py-1.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>{children}</td>;
  },
  a({ children, href }: { children?: React.ReactNode; href?: string }) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>{children}</a>;
  },
};

/* ── Render markdown content ── */
function MarkdownContent({ content }: { content: string }): React.JSX.Element {
  return (
    <div className="text-sm leading-relaxed markdown-content" style={{ color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}>
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents as never}>
        {content}
      </Markdown>
    </div>
  );
}

/* ── Message Bubble ── */
function MessageBubble({ message }: { message: Message }): React.JSX.Element {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className="max-w-[80%] px-4 py-3 rounded-lg"
        style={{
          background: isSystem ? 'rgba(153, 69, 255, 0.06)' : isUser ? 'rgba(0, 255, 136, 0.08)' : 'var(--bg-surface)',
          border: `1px solid ${isSystem ? 'rgba(153, 69, 255, 0.3)' : isUser ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        }}
      >
        {/* Role label */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase" style={{
            color: isSystem ? 'var(--accent-purple)' : isUser ? 'var(--accent-green)' : 'var(--accent-cyan)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
          }}>
            {message.role}
          </span>
        </div>

        {/* Content — assistant messages rendered as Markdown */}
        {message.role === 'assistant' ? (
          <MarkdownContent content={message.content} />
        ) : (
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              color: 'var(--text-primary)',
              fontFamily: isSystem ? "'Inter', sans-serif" : "'JetBrains Mono', monospace",
            }}
          >
            {message.content}
          </div>
        )}

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
        {content ? (
          <MarkdownContent content={content} />
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>...</span>
        )}
      </div>
    </div>
  );
}

/* ── Chat Input with Stop button ── */
function ChatInput({ onSend, onStop, disabled, isRunning, isRunningOtherChat }: { onSend: (msg: string) => void; onStop: () => void; disabled: boolean; isRunning: boolean; isRunningOtherChat: boolean }): React.JSX.Element {
  const [input, setInput] = useState('');
  const blocked = disabled || isRunning || isRunningOtherChat;

  const handleSend = useCallback(() => {
    if (!input.trim() || blocked) return;
    onSend(input.trim());
    setInput('');
  }, [input, blocked, onSend]);

  return (
    <div className="border-t p-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-dark)' }}>
      {isRunningOtherChat && (
        <div className="flex items-center justify-between mb-2 px-2 py-1.5 rounded" style={{ background: 'rgba(255, 204, 0, 0.08)', border: '1px solid rgba(255, 204, 0, 0.2)' }}>
          <span className="text-xs" style={{ color: 'var(--accent-yellow)', fontFamily: "'JetBrains Mono', monospace" }}>
            ⏳ Model is generating in another conversation — stop it first to chat here
          </span>
          <button
            onClick={onStop}
            className="ml-2 px-3 py-1 rounded text-xs font-bold uppercase cursor-pointer transition-all flex-shrink-0"
            style={{
              background: 'rgba(255, 51, 85, 0.15)',
              color: 'var(--accent-red)',
              border: '1px solid rgba(255, 51, 85, 0.3)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Stop
          </button>
        </div>
      )}
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
          placeholder={
            isRunning
              ? '⏳ Model is generating a response — please wait or click Stop'
              : isRunningOtherChat
                ? '⏳ Model busy in another conversation — stop it to chat here'
                : disabled
                  ? 'Load a model first...'
                  : 'Type a message... (Shift+Enter for new line)'
          }
          disabled={blocked}
          rows={2}
          className="flex-1 px-3 py-2 rounded text-sm resize-none outline-none custom-scrollbar"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            fontFamily: "'JetBrains Mono', monospace",
            opacity: blocked ? 0.5 : 1,
          }}
        />
        {(isRunning || isRunningOtherChat) ? (
          <button
            onClick={onStop}
            className="px-4 py-2 rounded text-xs font-bold uppercase cursor-pointer transition-all"
            style={{
              background: 'rgba(255, 51, 85, 0.15)',
              color: 'var(--accent-red)',
              border: '1px solid rgba(255, 51, 85, 0.3)',
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: '0 0 8px rgba(255, 51, 85, 0.2)',
            }}
          >
            ■ Stop
          </button>
        ) : (
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
        )}
      </div>
    </div>
  );
}

/* ── Export helpers ── */
function exportAsMarkdown(messages: Message[], title: string): void {
  const md = `# ${title}\n\n` + messages.map((m) => {
    const label = m.role === 'user' ? '**User**' : m.role === 'assistant' ? '**Assistant**' : '**System**';
    return `${label}:\n${m.content}\n`;
  }).join('\n---\n\n');

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsJSON(messages: Message[], title: string): void {
  const data = {
    title,
    exportedAt: new Date().toISOString(),
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      tokenCount: m.tokenCount,
      createdAt: m.createdAt,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Main Chat Page ── */
export function ChatPage(): React.JSX.Element {
  const { messages, activeConversationId, conversations } = useChatStore();
  const { loadedModel, isRunning, currentTokens, tokensPerSecond, stopInference, inferenceConversationId } = useInferenceStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showExport, setShowExport] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTokens]);

  const handleSend = useCallback(async (content: string) => {
    if (!activeConversationId) return;

    // Capture the conversation ID at send time so it doesn't change if user switches chats
    const targetConversationId = activeConversationId;

    // Add user message directly via IPC using captured ID (not store's activeConversationId)
    const userMsgResult = await window.api.invoke('chat:add-message', {
      conversationId: targetConversationId,
      role: 'user',
      content,
    }) as { success: boolean; data?: Message };

    // Only update UI if still viewing the target conversation
    if (userMsgResult.success && userMsgResult.data) {
      const currentActiveId = useChatStore.getState().activeConversationId;
      if (currentActiveId === targetConversationId) {
        useChatStore.setState((s) => ({
          messages: [...s.messages, userMsgResult.data!],
        }));
      }
    }

    // Trigger inference — pass the conversation ID so the store tracks it
    try {
      const inferenceStore = useInferenceStore.getState();
      await inferenceStore.runInference(content, targetConversationId);

      // After inference completes, save assistant message to the ORIGINAL conversation
      const finalTokens = useInferenceStore.getState().currentTokens;
      if (finalTokens) {
        const result = await window.api.invoke('chat:add-message', {
          conversationId: targetConversationId,
          role: 'assistant',
          content: finalTokens,
        }) as { success: boolean; data?: Message };

        // Only update UI messages if we're still viewing the same conversation
        if (result.success && result.data) {
          const currentActiveId = useChatStore.getState().activeConversationId;
          if (currentActiveId === targetConversationId) {
            useChatStore.setState((s) => ({
              messages: [...s.messages, result.data!],
            }));
          }
        }
      }
    } catch {
      // Inference error handled in store
    }
  }, [activeConversationId]);

  const handleStop = useCallback(() => {
    stopInference();
  }, [stopInference]);

  return (
    <div className="flex h-full">
      {/* Conversation sidebar */}
      <ConversationList />

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header with export */}
        {activeConversationId && activeConv && (
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-dark)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                {activeConv.title}
              </span>
              {activeConv.systemPrompt && (
                <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(153, 69, 255, 0.1)', color: 'var(--accent-purple)', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
                  System Prompt
                </span>
              )}
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowExport(!showExport)}
                className="text-xs px-2 py-1 cursor-pointer hover:bg-white/5 rounded transition-colors"
                style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Export
              </button>
              {showExport && (
                <div className="absolute right-0 top-full mt-1 z-50 rounded py-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', minWidth: 140 }}>
                  <button
                    onClick={() => { exportAsMarkdown(messages, activeConv.title); setShowExport(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs cursor-pointer hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Export as Markdown
                  </button>
                  <button
                    onClick={() => { exportAsJSON(messages, activeConv.title); setShowExport(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs cursor-pointer hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Export as JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
              {isRunning && inferenceConversationId === activeConversationId && (
                <StreamingMessage content={currentTokens} />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Token stats bar */}
        {((isRunning && inferenceConversationId === activeConversationId) || tokensPerSecond > 0) && (
          <div className="px-4 py-1 border-t flex items-center gap-4" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-dark)' }}>
            <span className="text-xs" style={{ color: 'var(--accent-green)', fontFamily: "'JetBrains Mono', monospace" }}>
              {tokensPerSecond.toFixed(1)} tok/s
            </span>
            {isRunning && inferenceConversationId === activeConversationId && (
              <span className="text-xs" style={{ color: 'var(--accent-yellow)', fontFamily: "'JetBrains Mono', monospace" }}>
                generating...
              </span>
            )}
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onStop={handleStop}
          disabled={!loadedModel || !activeConversationId}
          isRunning={isRunning && inferenceConversationId === activeConversationId}
          isRunningOtherChat={isRunning && inferenceConversationId !== activeConversationId}
        />
      </div>
    </div>
  );
}
