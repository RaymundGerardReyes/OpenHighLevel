'use client';

export function NodePalette() {
  const nodeItems = [
    { type: 'trigger', label: 'Trigger Event', bg: 'bg-emerald-50 border-emerald-300 text-emerald-800' },
    { type: 'action', label: 'Set Contact Field', bg: 'bg-blue-50 border-blue-300 text-blue-800' },
    { type: 'condition', label: 'If / Else Branch', bg: 'bg-amber-50 border-amber-300 text-amber-800' },
    { type: 'wait', label: 'Wait Duration', bg: 'bg-purple-50 border-purple-300 text-purple-800' },
    { type: 'goal', label: 'Goal Milestone', bg: 'bg-pink-50 border-pink-300 text-pink-800' },
    { type: 'end', label: 'End Workflow', bg: 'bg-slate-100 border-slate-300 text-slate-800' },
  ];

  return (
    <aside className="w-56 bg-white border-r p-4 flex flex-col gap-2 z-10">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Node Palette</div>
      {nodeItems.map((item) => (
        <div
          key={item.type}
          draggable
          className={`p-2.5 rounded border text-xs font-semibold cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition ${item.bg}`}
        >
          {item.label}
        </div>
      ))}
    </aside>
  );
}
