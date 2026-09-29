'use client';

import { useBuilderStore } from '../../stores/builder.store';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodePalette } from './NodePalette';
import { InspectorPanel } from './InspectorPanel';

interface BuilderShellProps {
  workflowId: string;
}

export function BuilderShell({ workflowId }: BuilderShellProps) {
  const isDirty = useBuilderStore((s) => s.isDirty);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800">OpenFlow Builder</span>
          <span className="text-xs text-slate-400 font-mono">ID: {workflowId.slice(0, 8)}</span>
          {isDirty && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">Unsaved</span>}
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded hover:bg-slate-50">
            Simulate (Fast)
          </button>
          <button className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">
            Publish Version
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <NodePalette />
        <div className="flex-1 h-full">
          <WorkflowCanvas />
        </div>
        <InspectorPanel />
      </div>
    </div>
  );
}
