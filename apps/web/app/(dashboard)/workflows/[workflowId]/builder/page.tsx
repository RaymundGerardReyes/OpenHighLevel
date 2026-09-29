'use client';

import { useParams } from 'next/navigation';
import { BuilderShell } from '@/features/workflows/components/builder/BuilderShell';

export default function WorkflowBuilderPage() {
  const params = useParams();
  const workflowId = params.workflowId as string;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden">
      <BuilderShell workflowId={workflowId} />
    </div>
  );
}
