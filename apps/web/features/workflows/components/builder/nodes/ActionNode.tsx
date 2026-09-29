'use client';

import { Handle, Position } from '@xyflow/react';

export function ActionNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-500 text-white text-xs font-semibold border border-blue-600 min-w-[140px] text-center">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-blue-700" />
      <div className="text-[10px] uppercase tracking-wide opacity-80">Action</div>
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-blue-700" />
    </div>
  );
}
