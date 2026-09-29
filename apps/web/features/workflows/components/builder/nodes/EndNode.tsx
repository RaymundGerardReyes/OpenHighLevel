'use client';

import { Handle, Position } from '@xyflow/react';

export function EndNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-slate-700 text-white text-xs font-semibold border border-slate-800 min-w-[120px] text-center">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-slate-900" />
      <div className="text-[10px] uppercase tracking-wide opacity-80">End</div>
      <div>{data.label}</div>
    </div>
  );
}
