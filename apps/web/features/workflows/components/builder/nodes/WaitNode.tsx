'use client';

import { Handle, Position } from '@xyflow/react';

export function WaitNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-purple-500 text-white text-xs font-semibold border border-purple-600 min-w-[140px] text-center">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-purple-700" />
      <div className="text-[10px] uppercase tracking-wide opacity-80">Wait</div>
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-purple-700" />
    </div>
  );
}
