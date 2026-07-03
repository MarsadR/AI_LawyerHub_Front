import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, User, Loader2, RefreshCw,
  Copy, Zap, Plus, Menu, MessageSquare,
  Trash2, Check, Pencil, X, Code2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────────────
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F9FF}\u{200D}\u{FE0F}]/gu;
const SECTION_HEADERS = [
  { re: /^[\u{1F4D6}\u{1F4D4}\u{1F4D2}\u{1F516}]?\s*ANSWER\s*$/iu,            key: 'answer',      label: 'Answer' },
  { re: /^[\u{1F4CC}]?\s*KEY PASSAGES/iu,          key: 'passages',    label: 'Key Passages' },
  { re: /^[\u{1F4DA}]?\s*STATUTORY LAW/iu,         key: 'statutory',   label: 'Statutory Law References' },
  { re: /^[\u2696]?\s*COURT JUDGEMENT/iu,          key: 'judgements',  label: 'Court Judgement References' },
  { re: /^[\u{1F50E}]?\s*CONCLUSION/iu,            key: 'conclusion',  label: 'Conclusion' },
];

function stripEmojis(str) {
  return str.replace(EMOJI_RE, '').trim();
}

function parseAIResponse(raw) {
  const cleaned = raw
    .replace(/\[QA_STATUS:.*?\]/gi, '')
    .trim();

  const lines = cleaned.split('\n');
  const sections = [];
  let current = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (current) current.lines.push('');
      continue;
    }

    let matched = false;
    for (const hdr of SECTION_HEADERS) {
      if (hdr.re.test(trimmed)) {
        current = { key: hdr.key, label: hdr.label, lines: [] };
        sections.push(current);
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (!current) {
        current = { key: 'preamble', label: '', lines: [] };
        sections.push(current);
      }
      current.lines.push(stripEmojis(trimmed));
    }
  }

  return sections;
}

function InlineText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

const SECTION_STYLES = {
  answer:     { accent: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)', dot: '#A78BFA' },
  passages:   { accent: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', dot: '#60A5FA' },
  statutory:  { accent: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)', dot: '#34D399' },
  judgements: { accent: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)', dot: '#FBBF24' },
  conclusion: { accent: 'rgba(244,63,94,0.07)',  border: 'rgba(244,63,94,0.2)',   dot: '#F87171' },
  preamble:   { accent: 'transparent',           border: 'transparent',            dot: '#A78BFA' },
};



function renderLines(lines, sectionKey, dotColor) {
  const result = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      result.push(
        <ul key={'ul-' + result.length} style={{ margin: '6px 0 8px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 8 }} />
              <span style={{ lineHeight: 1.75 }}><InlineText text={item} /></span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { flushList(); continue; }

    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) { listItems.push(numMatch[2]); continue; }

    const bulletMatch = line.match(/^[*\-•]\s+(.+)/);
    if (bulletMatch) { listItems.push(bulletMatch[1]); continue; }

    if (line.startsWith('"') || line.startsWith('\u201C') || line.startsWith('\u2018')) {
      flushList();
      result.push(
        <blockquote key={'bq-' + i} style={{
          margin: '10px 0', padding: '10px 14px',
          borderLeft: '3px solid ' + dotColor,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '0 8px 8px 0',
          color: 'var(--text-2)', fontStyle: 'italic', fontSize: 13, lineHeight: 1.75
        }}>
          <InlineText text={line} />
        </blockquote>
      );
      continue;
    }

    flushList();
    result.push(
      <p key={'p-' + i} style={{ margin: '4px 0', lineHeight: 1.8 }}>
        <InlineText text={line} />
      </p>
    );
  }

  flushList();
  return result;
}

function FormattedAIResponse({ content }) {
  const sections = parseAIResponse(content);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sections.map((sec, idx) => {
        const sty = SECTION_STYLES[sec.key] || SECTION_STYLES.preamble;
        const body = renderLines(sec.lines, sec.key, sty.dot);
        if (!body.length) return null;

        if (sec.key === 'preamble') {
          return (
            <div key={idx} style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text)' }}>
              {body}
            </div>
          );
        }

        const iconMap = { answer: '◆', passages: '❝', statutory: '§', judgements: '⚖', conclusion: '▸' };
        const icon = iconMap[sec.key] || '';

        return (
          <div key={idx} style={{
            background: sty.accent,
            border: '1px solid ' + sty.border,
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '8px 14px',
              borderBottom: '1px solid ' + sty.border,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              {icon && <span style={{ color: sty.dot, fontSize: 12 }}>{icon}</span>}
              <span style={{
                fontSize: 10, fontWeight: 800,
                color: sty.dot,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontFamily: 'monospace'
              }}>
                {sec.label}
              </span>
            </div>
            <div style={{ padding: '10px 14px', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.8 }}>
              {body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PROMPTS = [
  "What are the grounds for divorce under Pakistani law?",
  "Explain the concept of bail in criminal proceedings",
  "What are tenant rights under rental law?",
  "How to file a civil suit in Pakistan?",
  "What is the limitation period for contract disputes?",
  "Explain the difference between FIR and complaint",
];

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: 'rgba(139,92,246,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <Bot size={16} color="#A78BFA" />
      </div>
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 16, borderBottomLeftRadius: 4,
        padding: '12px 16px',
        display: 'flex', gap: 4, alignItems: 'center'
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: 3,
            background: 'var(--primary)',
            animation: 'bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`
          }} />
        ))}
      </div>
    </div>
  );
}

export default function AIChatPage() {
  const { API } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1, role: 'assistant',
      content: "Hello Counselor! 👋 I'm your AI Legal Assistant, trained on Pakistani law. Ask me anything about legal procedures, statutes, case law, or legal research.",
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [mode, setMode] = useState('general'); // 'general' (General Chat) by default
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');
  const [longPressMenu, setLongPressMenu] = useState(null); // { msgId, msgIdx, x, y }
  const [codeMode, setCodeMode] = useState(false);

  const bottomRef = useRef();
  const inputRef = useRef();
  const editRef = useRef();
  const longPressTimer = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mob = window.innerWidth <= 768;
      setIsMobile(mob);
      if (!mob) setShowSidebar(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/lawyer-ai-chats`);
      setChats(res.data.chats || []);
    } catch (err) {
      console.error('Failed to fetch chats', err);
    }
  }, [API]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadChat = async (id) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/lawyer-ai-chats/${id}`);
      const chat = res.data.chat;
      if (chat) {
        const formatted = chat.messages.map((m, idx) => ({
          id: m._id || idx,
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.text,
          time: new Date(m.createdAt)
        }));
        setMessages(formatted.length > 0 ? formatted : [
          {
            id: 1, role: 'assistant',
            content: "Hello Counselor! 👋 I'm your AI Legal Assistant, trained on Pakistani law. Ask me anything about legal procedures, statutes, case law, or legal research.",
            time: new Date()
          }
        ]);
        setActiveChatId(id);
      }
    } catch {
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([
      {
        id: 1, role: 'assistant',
        content: "Hello Counselor! 👋 I'm your AI Legal Assistant, trained on Pakistani law. Ask me anything about legal procedures, statutes, case law, or legal research.",
        time: new Date()
      }
    ]);
  };

  const sendMessage = useCallback(async (text) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: q, time: new Date() };
    setMessages(m => [...m, userMsg]);
    setLoading(true);

    try {
      let res;
      if (activeChatId) {
        res = await axios.post(`${API}/api/lawyer-ai-chats/${activeChatId}/message`, { message: q, mode });
      } else {
        res = await axios.post(`${API}/api/lawyer-ai-chats/new-message`, { message: q, mode });
      }
      
      const answer = res.data.reply || 'No response received.';
      setMessages(m => [...m, {
        id: Date.now() + 1, role: 'assistant', content: answer, time: new Date()
      }]);
      
      if (res.data.chat) {
        setActiveChatId(res.data.chat._id);
        fetchChats();
      }
    } catch {
      setMessages(m => [...m, {
        id: Date.now() + 1, role: 'assistant',
        content: '⚠️ AI service is currently unavailable. Please try again later.',
        time: new Date(), error: true
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, activeChatId, mode, API, fetchChats]);

  const copyText = (id, text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const clearChat = () => {
    startNewChat();
  };

  const handleDeleteChat = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat history?')) return;
    try {
      await axios.delete(`${API}/api/lawyer-ai-chats/${id}`);
      toast.success('Chat deleted');
      if (activeChatId === id) {
        startNewChat();
      }
      fetchChats();
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditText('');
  };

  const saveEdit = useCallback(async (msgId, msgIdx) => {
    const newText = editText.trim();
    if (!newText || loading) return;

    // Slice messages up to (but not including) the edited user message,
    // then append the updated user message. Any subsequent AI reply is dropped.
    setMessages(prev => prev.slice(0, msgIdx));
    setEditingMsgId(null);
    setEditText('');

    // Re-send as a fresh message (sendMessage reads `input`, so pass directly)
    const userMsg = { id: Date.now(), role: 'user', content: newText, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      let res;
      if (activeChatId) {
        res = await axios.post(`${API}/api/lawyer-ai-chats/${activeChatId}/message`, { message: newText, mode });
      } else {
        res = await axios.post(`${API}/api/lawyer-ai-chats/new-message`, { message: newText, mode });
      }
      const answer = res.data.reply || 'No response received.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: answer, time: new Date() }]);
      if (res.data.chat) {
        setActiveChatId(res.data.chat._id);
        fetchChats();
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: 'AI service is currently unavailable. Please try again later.',
        time: new Date(), error: true
      }]);
    } finally {
      setLoading(false);
    }
  }, [editText, loading, activeChatId, mode, API, fetchChats]);

  return (
    <div style={{
      height: 'calc(100vh - 68px)',
      display: 'flex',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Sidebar Panel */}
      {showSidebar && (
        <>
          {isMobile && (
            <div 
              onClick={() => setShowSidebar(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
              }}
            />
          )}
          <div style={{
            width: 280, flexShrink: 0,
            background: 'rgba(7,11,20,0.5)', borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            position: isMobile ? 'fixed' : 'relative',
            height: '100%', top: 0, left: 0, zIndex: 45,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease-in-out'
          }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40 }}
                onClick={() => { startNewChat(); if (isMobile) setShowSidebar(false); }}
              >
                <Plus size={16} /> New Chat
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chats.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13, padding: 20 }}>
                  No chat history
                </div>
              ) : (
                chats.map(c => {
                  const isActive = activeChatId === c._id;
                  return (
                    <div
                      key={c._id}
                      onClick={() => { loadChat(c._id); if (isMobile) setShowSidebar(false); }}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        background: isActive ? 'rgba(139,92,246,0.12)' : 'transparent',
                        color: isActive ? 'var(--primary-light)' : 'var(--text-dim)',
                        border: isActive ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'var(--surface-2)';
                          e.currentTarget.style.color = 'var(--text)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-dim)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                        <MessageSquare size={14} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }} className="truncate">
                          {c.title}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteChat(e, c._id)}
                        style={{
                          background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                          color: 'var(--text-dim)', display: 'flex', transition: 'color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          padding: '0 24px', height: 64, flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(7,11,20,0.9)', backdropFilter: 'blur(20px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text)', 
                  cursor: 'pointer', display: 'flex', padding: 4
                }}
              >
                <Menu size={20} />
              </button>
            )}
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(139,92,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse-glow 2s infinite',
              flexShrink: 0
            }}>
              <Bot size={20} color="#A78BFA" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>AI Legal Assistant</p>
              <p style={{ fontSize: 11, color: 'var(--emerald)' }}>● Online · Pakistani Law Expert</p>
            </div>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={clearChat}>
            <RefreshCw size={13} /> New
          </button>
        </div>

      {/* Messages */}
      <div
        onContextMenu={e => e.preventDefault()}
        style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
      >

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={12} /> Suggested questions
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  style={{
                    padding: '7px 12px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    color: 'var(--text-2)',
                    fontSize: 12, cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => { e.target.style.background = 'var(--surface-3)'; e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary-light)'; }}
                  onMouseLeave={e => { e.target.style.background = 'var(--surface-2)'; e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-2)'; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, msgIdx) => {
          const isEditing = editingMsgId === msg.id;
          return (
            <div
              key={msg.id}
              style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
              className="animate-fade-in"
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(139,92,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 4
                }}>
                  <Bot size={16} color="#A78BFA" />
                </div>
              )}

              <div style={{ maxWidth: msg.role === 'assistant' ? '88%' : '78%' }}>

                {/* ── User message bubble ── */}
                {msg.role === 'user' && (
                  isEditing ? (
                    /* ── Inline edit mode ── */
                    <div style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--primary)',
                      borderRadius: 18, borderBottomRightRadius: 4,
                      overflow: 'hidden',
                      boxShadow: '0 0 0 3px rgba(139,92,246,0.15)'
                    }}>
                      <textarea
                        ref={editRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(msg.id, msgIdx); }
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        style={{
                          width: '100%', minHeight: 72, maxHeight: 200,
                          background: 'transparent', border: 'none', outline: 'none',
                          color: 'var(--text)', fontSize: 14, lineHeight: 1.6,
                          fontFamily: 'inherit', resize: 'vertical',
                          padding: '12px 14px', boxSizing: 'border-box'
                        }}
                      />
                      <div style={{
                        display: 'flex', justifyContent: 'flex-end', gap: 8,
                        padding: '8px 12px', borderTop: '1px solid var(--border)'
                      }}>
                        <button
                          onClick={cancelEdit}
                          style={{
                            background: 'var(--surface-3)', border: '1px solid var(--border)',
                            borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                            color: 'var(--text-dim)', fontSize: 12, display: 'flex',
                            alignItems: 'center', gap: 5, fontFamily: 'inherit'
                          }}
                        >
                          <X size={12} /> Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(msg.id, msgIdx)}
                          disabled={!editText.trim() || loading}
                          style={{
                            background: 'var(--grad-primary)', border: 'none',
                            borderRadius: 8, padding: '5px 14px', cursor: 'pointer',
                            color: '#fff', fontSize: 12, fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
                            opacity: (!editText.trim() || loading) ? 0.5 : 1
                          }}
                        >
                          <Send size={12} /> Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal user bubble: hover (desktop) or long-press (mobile) ── */
                    <div
                      className="user-msg-wrap"
                      style={{ position: 'relative' }}
                      onContextMenu={e => e.preventDefault()}
                      /* Desktop hover */
                      onMouseEnter={e => { if (!isMobile) { const w = e.currentTarget.querySelector('.user-action-btns'); if (w) w.style.opacity = '1'; } }}
                      onMouseLeave={e => { if (!isMobile) { const w = e.currentTarget.querySelector('.user-action-btns'); if (w) w.style.opacity = '0'; } }}
                      /* Mobile long-press */
                      onTouchStart={e => {
                        if (!isMobile) return;
                        const touch = e.touches[0];
                        longPressTimer.current = setTimeout(() => {
                          setLongPressMenu({ msgId: msg.id, msgIdx, x: touch.clientX, y: touch.clientY });
                        }, 500);
                      }}
                      onTouchEnd={() => { clearTimeout(longPressTimer.current); }}
                      onTouchMove={() => { clearTimeout(longPressTimer.current); }}
                    >
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: 18, borderBottomRightRadius: 4,
                        background: 'var(--grad-primary)',
                        color: '#fff', fontSize: 14, lineHeight: 1.6,
                        wordBreak: 'break-word',
                        userSelect: isMobile ? 'none' : 'text',
                        WebkitUserSelect: isMobile ? 'none' : 'text',
                        WebkitTouchCallout: 'none'
                      }}>
                        {msg.content}
                      </div>
                      {/* Desktop: edit + copy icons on hover */}
                      {!isMobile && (
                        <div
                          className="user-action-btns"
                          style={{
                            position: 'absolute', top: '50%', left: -74,
                            transform: 'translateY(-50%)',
                            opacity: 0, transition: 'opacity 0.2s',
                            display: 'flex', gap: 4
                          }}
                        >
                          <button
                            onClick={() => copyText(msg.id, msg.content)}
                            title="Copy message"
                            style={{
                              background: 'var(--surface-2)', border: '1px solid var(--border)',
                              borderRadius: 8, width: 28, height: 28,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: 'var(--text-dim)'
                            }}
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            className="edit-btn"
                            onClick={() => { setEditingMsgId(msg.id); setEditText(msg.content); setTimeout(() => editRef.current?.focus(), 50); }}
                            title="Edit message"
                            style={{
                              background: 'var(--surface-2)', border: '1px solid var(--border)',
                              borderRadius: 8, width: 28, height: 28,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: 'var(--text-dim)'
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                )}

                {/* ── Assistant message bubble ── */}
                {msg.role === 'assistant' && (
                  <div
                    onContextMenu={e => e.preventDefault()}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 18, borderBottomLeftRadius: 4,
                      background: msg.error ? 'rgba(244,63,94,0.1)' : 'var(--surface-2)',
                      border: `1px solid ${msg.error ? 'rgba(244,63,94,0.2)' : 'var(--border)'}`,
                      color: 'var(--text)', fontSize: 14, lineHeight: 1.6,
                      wordBreak: 'break-word'
                    }}
                  >
                    <FormattedAIResponse content={msg.content} />
                  </div>
                )}

                {/* ── Timestamp + Copy (assistant) ── */}
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => copyText(msg.id, msg.content)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', padding: 4 }}
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                )}

                {/* ── Timestamp (user, not editing) ── */}
                {msg.role === 'user' && !isEditing && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 4
                }}>
                  <User size={16} color="#60A5FA" />
                </div>
              )}
            </div>
          );
        })}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />

        {/* ── Mobile long-press context menu ── */}
        {longPressMenu && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 200 }}
              onClick={(e) => { e.stopPropagation(); setLongPressMenu(null); }}
              onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); clearTimeout(longPressTimer.current); setLongPressMenu(null); }}
            />
            <div style={{
              position: 'fixed',
              top: Math.min(longPressMenu.y, window.innerHeight - 120),
              left: Math.min(longPressMenu.x, window.innerWidth - 170),
              zIndex: 201,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              minWidth: 160,
              animation: 'slide-up 0.18s ease-out'
            }}>
              {/* Copy option */}
              <button
                onClick={() => {
                  const m = messages.find(x => x.id === longPressMenu.msgId);
                  if (m) { navigator.clipboard.writeText(m.content); toast.success('Copied!'); }
                  setLongPressMenu(null);
                }}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  padding: '13px 16px', cursor: 'pointer',
                  color: 'var(--text)', fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: 'inherit'
                }}
              >
                <Copy size={15} color="#60A5FA" />
                <span>Copy message</span>
              </button>
              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
              {/* Edit option */}
              <button
                onClick={() => {
                  const { msgId } = longPressMenu;
                  const m = messages.find(x => x.id === msgId);
                  if (m) { setEditingMsgId(msgId); setEditText(m.content); setTimeout(() => editRef.current?.focus(), 50); }
                  setLongPressMenu(null);
                }}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  padding: '13px 16px', cursor: 'pointer',
                  color: 'var(--text)', fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: 'inherit'
                }}
              >
                <Pencil size={15} color="#A78BFA" />
                <span>Edit message</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Input bar */}
      <div style={{
        padding: '12px 24px 16px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(7,11,20,0.9)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 16, padding: '4px 4px 4px 16px',
          transition: 'border-color 0.2s',
        }}
        onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--primary)'}
        onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {/* Model picker dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              style={{
                background: showModelPicker ? 'rgba(255,255,255,0.05)' : 'none',
                border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderRadius: '50%',
                transition: 'all 0.2s',
                width: 28, height: 28,
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-light)'}
              onMouseLeave={e => { if (!showModelPicker) e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Plus size={18} />
            </button>
            
            {showModelPicker && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                  onClick={() => setShowModelPicker(false)} 
                />
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  padding: 6, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 2,
                  minWidth: 180, transformOrigin: 'bottom left', animation: 'slide-up 0.2s ease-out'
                }}>
                  {[
                    { key: 'general', label: 'General Chat Model', desc: 'Fast, conversation-style QA' },
                    { key: 'legal_assistant', label: 'Reference Model', desc: 'Statutes & citations' }
                  ].map(m => (
                    <button
                      key={m.key}
                      style={{
                        background: mode === m.key ? 'rgba(59,130,246,0.1)' : 'transparent',
                        color: mode === m.key ? 'var(--primary-light)' : 'var(--text)',
                        border: 'none', borderRadius: 8, padding: '8px 12px',
                        fontSize: 13, fontWeight: mode === m.key ? 700 : 500,
                        textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', gap: 2, width: '100%'
                      }}
                      onClick={() => {
                        setMode(m.key);
                        setShowModelPicker(false);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>{m.label}</span>
                        {mode === m.key && <Check size={14} />}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 400 }}>{m.desc}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Code block toggle */}
          <button
            onClick={() => {
              if (!codeMode) {
                // Wrap current input in a code fence
                const fence = '```\n' + (input ? input + '\n' : '') + '```';
                setInput(fence);
                setCodeMode(true);
                setTimeout(() => {
                  if (inputRef.current) {
                    const pos = fence.indexOf('\n') + 1;
                    inputRef.current.setSelectionRange(pos, pos + (input ? input.length : 0));
                    inputRef.current.focus();
                  }
                }, 30);
              } else {
                // Strip code fences
                const stripped = input.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
                setInput(stripped);
                setCodeMode(false);
                setTimeout(() => inputRef.current?.focus(), 30);
              }
            }}
            title={codeMode ? 'Exit code mode' : 'Insert code block'}
            style={{
              background: codeMode ? 'rgba(52,211,153,0.15)' : 'none',
              border: codeMode ? '1px solid rgba(52,211,153,0.4)' : 'none',
              borderRadius: 8, width: 30, height: 30, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: codeMode ? '#34D399' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            <Code2 size={16} />
          </button>

          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            onChange={e => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            placeholder={codeMode ? 'Paste your code here…' : mode === 'general' ? 'Ask general questions…' : 'Search legal references & citations…'}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: codeMode ? '#34D399' : 'var(--text)',
              fontSize: 14,
              fontFamily: codeMode ? "'Fira Code', 'Cascadia Code', 'Courier New', monospace" : 'inherit',
              padding: '8px 0',
              resize: 'none',
              overflow: 'hidden',
              minHeight: 22,
              lineHeight: 1.5
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn btn-primary"
            style={{ borderRadius: 12, padding: '10px 14px', flexShrink: 0 }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <Send size={16} />}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
          AI responses are for informational purposes only — verify with official legal sources
        </p>
      </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
