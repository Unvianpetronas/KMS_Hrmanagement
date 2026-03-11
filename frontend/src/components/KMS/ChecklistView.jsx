import { useState } from 'react';

export default function ChecklistView({ content }) {
  const [checked, setChecked] = useState({});
  const lines = content.split('\n').filter((l) => l.trim());

  const isCheckItem = (line) => {
    const t = line.trim();
    return t.startsWith('☐') || t.startsWith('☑') || t.startsWith('- ') || /^\d+[\.\)]\s/.test(t);
  };
  const isHeader = (line) => {
    const t = line.trim();
    return t === t.toUpperCase() && t.length > 3 && !isCheckItem(line);
  };

  const checkItems = lines.filter(isCheckItem);
  const total = checkItems.length;
  const done = Object.values(checked).filter(Boolean).length;
  const pct = total ? (done / total) * 100 : 0;

  let itemIdx = 0;

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
        <div className="flex-1 h-1.5 bg-emerald-100 rounded overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
          {done}/{total} hoàn thành
        </span>
      </div>

      {/* Items */}
      {lines.map((line, i) => {
        if (isCheckItem(line)) {
          const ci = itemIdx++;
          const text = line.trim()
            .replace(/^☐\s*/, '').replace(/^☑\s*/, '')
            .replace(/^-\s*/, '').replace(/^\d+[\.\)]\s*/, '');
          return (
            <label
              key={i}
              className={`flex items-start gap-2.5 px-3 py-2.5 mb-1 rounded cursor-pointer transition-colors border ${
                checked[ci]
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white border-transparent hover:border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                checked={!!checked[ci]}
                onChange={() => setChecked((p) => ({ ...p, [ci]: !p[ci] }))}
                className="mt-0.5 cursor-pointer w-4 h-4 flex-shrink-0"
                style={{ accentColor: '#047857' }}
              />
              <span
                className={`text-sm leading-relaxed transition-colors ${
                  checked[ci] ? 'line-through text-slate-400' : 'text-slate-700'
                }`}
              >
                {text}
              </span>
            </label>
          );
        }

        if (isHeader(line)) {
          return (
            <div
              key={i}
              className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-5 mb-2 pb-1.5 border-b border-gray-200"
            >
              {line.trim()}
            </div>
          );
        }

        if (line.trim()) {
          return (
            <div key={i} className="text-xs text-slate-500 pl-9 py-0.5 leading-relaxed">
              {line.trim()}
            </div>
          );
        }
        return null;
      })}

      {total === 0 && (
        <div className="py-8 text-center text-sm text-slate-400">
          Không tìm thấy checklist items. Mỗi dòng nên bắt đầu bằng ☐, -, hoặc 1.
        </div>
      )}
    </div>
  );
}
