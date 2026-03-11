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

const mdBotComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="pl-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  code: ({ children, className }) => className
    ? <code className="font-mono text-xs">{children}</code>
    : <code className="bg-slate-100 text-slate-700 px-1 rounded text-xs font-mono">{children}</code>,
};

function MessageBubble({ msg, onSelectDoc }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
          isUser ? 'bg-emerald-600' : 'bg-slate-600'
        }`}
      >
        {isUser ? 'U' : '🤖'}
      </div>

      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Bubble */}
        <div
          className={`rounded-md px-3 py-2.5 text-sm leading-relaxed border ${
            isUser
              ? 'bg-emerald-50 border-emerald-200 text-slate-800'
              : 'bg-white border-gray-200 text-slate-700'
          }`}
        >
          {isUser ? (
            <p className="m-0">{msg.content}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdBotComponents}>
              {msg.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Source doc chips */}
        {!isUser && msg.sourceDocs?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {msg.sourceDocs.map((doc) => {
              const type = doc.id.startsWith('POL') ? 'Policy' : doc.id.startsWith('FAQ') ? 'FAQ' : 'Checklist';
              const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.Policy;
              return (
                <button
                  key={doc.id}
                  onClick={() => onSelectDoc(doc.id)}
                  className="text-xs font-mono font-semibold px-2 py-0.5 rounded border cursor-pointer transition-colors hover:opacity-80"
                  style={{ background: `${cfg.accent}10`, color: cfg.accent, borderColor: `${cfg.accent}30` }}
                >
                  {doc.id}
                </button>
              );
            })}
          </div>
        )}

        {/* Model label */}
        {!isUser && msg.model && (
          <div className="text-xs text-slate-400 mt-1">{msg.model}</div>
        )}
      </div>
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

  const buildHistory = () => messages.map((m) => ({ role: m.role, content: m.content }));

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await chatAPI.send(msg, buildHistory());
      setMessages((prev) => [...prev, { role: 'assistant', content: res.answer, sourceDocs: res.sourceDocs, model: res.model }]);
    } catch (err) {
      notify(err.message, 'error');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Xin lỗi, có lỗi xảy ra. Vui lòng kiểm tra kết nối AI.', sourceDocs: [] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md flex flex-col fade-in" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-base flex-shrink-0">
          🤖
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">HR AI Assistant</h2>
          <p className="text-xs text-slate-400">Hỏi bất kỳ câu hỏi về chính sách HR</p>
        </div>
        {messages.length > 0 && (
          <button
            className="btn-ghost text-xs ml-auto"
            onClick={() => setMessages([])}
          >
            Xóa lịch sử
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center gap-5">
            <div className="text-center">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Chào! Tôi là HR Assistant</h3>
              <p className="text-xs text-slate-500">Hỏi tôi về chính sách nghỉ phép, lương, onboarding và hơn thế nữa</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-md w-full">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-3 py-2.5 text-xs text-left text-slate-600 bg-white border border-gray-200 rounded-md hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} onSelectDoc={(id) => onNavigate('detail', id)} />
            ))}
            {loading && (
              <div className="flex items-end gap-2 mb-4">
                <div className="w-7 h-7 rounded bg-slate-600 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                <div className="bg-white border border-gray-200 rounded-md px-3 py-2.5">
                  <div className="flex gap-1 items-center">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400"
                        style={{ animation: `fadeIn 0.8s ${d}s infinite alternate` }}
                      />
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
      <div className="px-5 py-3.5 border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Hỏi về chính sách HR... (Enter để gửi)"
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className={`px-5 py-2 rounded text-sm font-medium border-0 transition-colors cursor-pointer ${
              input.trim() && !loading
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
