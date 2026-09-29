'use client';

import { Handle, Position } from '@xyflow/react';

export function TriggerNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-emerald-500 text-white text-xs font-semibold border border-emerald-600 min-w-[140px] text-center">
      <div className="text-[10px] uppercase tracking-wide opacity-80">Trigger</div>
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-emerald-700" />
    </div>
  );
}
