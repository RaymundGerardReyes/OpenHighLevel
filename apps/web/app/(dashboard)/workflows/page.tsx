'use client';

import Link from 'next/link';
import { useWorkflows, useCreateWorkflow } from '@/features/workflows/hooks/use-workflows';
import { useState } from 'react';

export default function WorkflowsListPage() {
  const { data: response, isLoading } = useWorkflows();
  const createMutation = useCreateWorkflow();
  const [name, setName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createMutation.mutateAsync({ name, description: 'Created from studio' });
    setName('');
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-slate-500 text-sm">Manage, test, and simulate workflow scenarios.</p>
        </div>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            placeholder="New workflow name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading workflows...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {response?.data?.items?.map((wf) => (
            <Link
              key={wf.id}
              href={`/workflows/${wf.id}/builder`}
              className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 transition block"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-800">{wf.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {wf.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{wf.description || 'No description provided.'}</p>
              <div className="mt-4 text-xs text-blue-600 font-medium">Open Builder &rarr;</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
