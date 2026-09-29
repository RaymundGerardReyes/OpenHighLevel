'use client';

import { useBuilderStore } from '../../stores/builder.store';

export function InspectorPanel() {
  const { selectedNodeId, nodes } = useBuilderStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <aside className="w-72 bg-white border-l p-4 z-10 flex flex-col">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Node Inspector</div>
      {selectedNode ? (
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-500 block mb-1">Node ID</label>
            <input
              type="text"
              readOnly
              value={selectedNode.id}
              className="w-full bg-slate-50 border rounded px-2 py-1 font-mono text-slate-600"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Label</label>
            <input
              type="text"
              defaultValue={selectedNode.data.label}
              className="w-full border rounded px-2 py-1 text-slate-800"
            />
          </div>
          <div>
            <label className="text-slate-500 block mb-1">Type</label>
            <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
              {selectedNode.type}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-400 mt-6 text-center">
          Select a canvas node to inspect parameters & execution trace.
        </div>
      )}
    </aside>
  );
}
