import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatAPI } from '../../services/api';
import { useToast } from '../UI/Toast';
import { TYPE_CONFIG } from '../../services/constants';

const SUGGESTED = [
  'Tôi có bao nhiêu ngày phép mỗi năm?',
  'Lương được thanh toán ngày mấy?',
  'Quy trình onboarding nhân viên mới?',
  'Chính sách làm việc từ xa là gì?',
];

function MessageBubble({ msg, onSelectDoc }) {
  const isUser = msg.role === 'user';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#14b8a6,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginRight: 10, alignSelf: 'flex-end' }}>
          🤖
        </div>
      )}

      <div style={{ maxWidth: '75%' }}>
        <div style={{
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.7)',
          border: `1px solid ${isUser ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
          backdropFilter: 'blur(16px)',
        }}>
          {isUser ? (
            <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>{msg.content}</p>
          ) : (
            <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.7 }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: '6px 0' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ paddingLeft: 18, margin: '6px 0' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: 3, lineHeight: 1.6 }}>{children}</li>,
                  strong: ({ children }) => <strong style={{ color: '#e2e8f0' }}>{children}</strong>,
                  code: ({ children, className }) => className
                    ? <code style={{ fontFamily: 'monospace', fontSize: 12 }}>{children}</code>
                    : <code style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '1px 5px', borderRadius: 3, fontSize: 12, fontFamily: 'monospace' }}>{children}</code>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Source doc chips */}
        {!isUser && msg.sourceDocs?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {msg.sourceDocs.map((doc) => {
              const type = doc.id.startsWith('POL') ? 'Policy' : doc.id.startsWith('FAQ') ? 'FAQ' : 'Checklist';
              const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Policy;
              return (
                <button
                  key={doc.id}
                  onClick={() => onSelectDoc(doc.id)}
                  style={{
                    padding: '3px 10px', borderRadius: 8, border: `1px solid ${cfg.accent}30`,
                    background: `${cfg.accent}10`, color: cfg.accent, fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${cfg.accent}20`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = `${cfg.accent}10`)}
                >
                  {doc.id}
                </button>
              );
            })}
          </div>
        )}

        {/* Model label */}
        {!isUser && msg.model && (
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
            {msg.model}
          </div>
        )}
      </div>

      {isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0, marginLeft: 10, alignSelf: 'flex-end' }}>
          U
        </div>
      )}
    </div>
  );
}

export default function ChatPanel({ onNavigate }) {
  const { notify } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildHistory = () =>
    messages.map((m) => ({ role: m.role, content: m.content }));

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatAPI.send(msg, buildHistory());
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: res.answer,
        sourceDocs: res.sourceDocs,
        model: res.model,
      }]);
    } catch (err) {
      notify(err.message, 'error');
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng kiểm tra kết nối AI.',
        sourceDocs: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="glass" style={{ borderRadius: '20px 20px 0 0', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#14b8a6,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 20px rgba(20,184,166,0.3)' }}>
            🤖
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg,#2dd4bf,#14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HR AI Assistant
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Hỏi bất kỳ câu hỏi về chính sách HR</p>
          </div>
          {messages.length > 0 && (
            <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 12 }} onClick={() => setMessages([])}>
              Xóa lịch sử
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="glass" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', borderRadius: 0 }}>
        {messages.length === 0 ? (
          /* Empty state with suggestions */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>Chào! Tôi là HR Assistant</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Hỏi tôi về chính sách nghỉ phép, lương, onboarding và hơn thế nữa</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 500 }}>
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  style={{
                    padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                    background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)',
                    color: '#5eead4', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(20,184,166,0.12)'; e.currentTarget.style.borderColor = 'rgba(20,184,166,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(20,184,166,0.06)'; e.currentTarget.style.borderColor = 'rgba(20,184,166,0.15)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                onSelectDoc={(id) => onNavigate('detail', id)}
              />
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#14b8a6,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                <div className="glass-light" style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dd4bf', animation: `fadeIn 0.6s ${d}s infinite alternate` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="glass" style={{ borderRadius: '0 0 20px 20px', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Hỏi về chính sách HR... (Enter để gửi)"
            disabled={loading}
            style={{ flex: 1, borderColor: input ? 'rgba(20,184,166,0.4)' : undefined }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              padding: '0 20px', borderRadius: 12, border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              background: input.trim() && !loading ? 'linear-gradient(135deg,#14b8a6,#0d9488)' : 'rgba(255,255,255,0.05)',
              color: input.trim() && !loading ? '#fff' : 'var(--text-dim)',
              fontWeight: 700, fontSize: 14, transition: 'all 0.3s',
              boxShadow: input.trim() && !loading ? '0 4px 20px rgba(20,184,166,0.3)' : 'none',
            }}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
