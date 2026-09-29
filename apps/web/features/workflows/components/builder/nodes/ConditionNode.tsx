'use client';

import { Handle, Position } from '@xyflow/react';

export function ConditionNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-amber-500 text-white text-xs font-semibold border border-amber-600 min-w-[150px] text-center">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-amber-700" />
      <div className="text-[10px] uppercase tracking-wide opacity-80">Condition</div>
      <div>{data.label}</div>
      <div className="flex justify-between text-[10px] px-2 pt-1 font-mono">
        <span>False</span>
        <span>True</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="false" className="left-6 w-2 h-2 bg-rose-600" />
      <Handle type="source" position={Position.Bottom} id="true" className="right-6 w-2 h-2 bg-emerald-600" />
    </div>
  );
}
