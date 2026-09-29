// scripts/templates/web-templates.js
// Frontend Next.js App Router, React Flow builder, Zustand store, and TanStack Query hooks

export const webTemplates = {
  'apps/web/package.json': JSON.stringify(
    {
      name: 'web',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        '@tanstack/react-query': '^5.66.0',
        '@xyflow/react': '^12.4.2',
        clsx: '^2.1.1',
        'lucide-react': '^1.16.0',
        next: '15.2.1',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        'tailwind-merge': '^3.0.1',
        zustand: '^5.0.3',
      },
      devDependencies: {
        '@types/node': '^22.13.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        postcss: '^8.5.1',
        tailwindcss: '^3.4.17',
        typescript: '^5.7.3',
      },
    },
    null,
    2
  ),

  'apps/web/tsconfig.json': JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: {
          '@/*': ['./*'],
        },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    },
    null,
    2
  ),

  'apps/web/next.config.mjs': `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@xyflow/react'],
};

export default nextConfig;
`,

  'apps/web/postcss.config.mjs': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,

  'apps/web/tailwind.config.ts': `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border, 214 32% 91%))',
        background: 'hsl(var(--background, 0 0% 100%))',
        foreground: 'hsl(var(--foreground, 222 47% 11%))',
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};
export default config;
`,

  'apps/web/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
}

body {
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  font-family: Arial, Helvetica, sans-serif;
}
`,

  'apps/web/app/layout.tsx': `import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'OpenFlow - Workflow Simulator',
  description: 'Requirements-driven CRM workflow simulator and laboratory',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`,

  'apps/web/app/providers.tsx': `'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
`,

  'apps/web/app/page.tsx': `import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-slate-200">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
          OpenFlow v0.1.0 Architecture Engine
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Requirements-Driven GHL Workflow Simulator
        </h1>
        <p className="text-lg text-slate-600">
          Trace-first execution simulator with virtual clock time travel, deterministic branch tracing, and durable PostgreSQL task scheduling.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/workflows"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Open Workflow Studio
          </Link>
          <a
            href="http://localhost:5000/swagger"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            API Docs (Swagger)
          </a>
        </div>
      </div>
    </main>
  );
}
`,

  'apps/web/app/(dashboard)/workflows/page.tsx': `'use client';

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
              href={\`/workflows/\${wf.id}/builder\`}
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
`,

  'apps/web/app/(dashboard)/workflows/[workflowId]/builder/page.tsx': `'use client';

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
`,

  // Stores
  'apps/web/features/workflows/stores/builder.store.ts': `import { create } from 'zustand';

export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string; config?: Record<string, any> };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

interface BuilderState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  isDirty: boolean;
  setNodes: (nodes: CanvasNode[]) => void;
  setEdges: (edges: CanvasEdge[]) => void;
  selectNode: (id: string | null) => void;
  addNode: (node: CanvasNode) => void;
  markClean: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  nodes: [
    { id: 'trigger_1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Contact Created' } },
    { id: 'condition_1', type: 'condition', position: { x: 250, y: 180 }, data: { label: 'Score > 50' } },
    { id: 'wait_1', type: 'wait', position: { x: 120, y: 320 }, data: { label: 'Wait 10 Mins' } },
    { id: 'action_1', type: 'action', position: { x: 380, y: 320 }, data: { label: 'Add VIP Tag' } },
    { id: 'end_1', type: 'end', position: { x: 250, y: 460 }, data: { label: 'Complete Run' } },
  ],
  edges: [
    { id: 'e1', source: 'trigger_1', target: 'condition_1' },
    { id: 'e2', source: 'condition_1', target: 'wait_1', sourceHandle: 'false' },
    { id: 'e3', source: 'condition_1', target: 'action_1', sourceHandle: 'true' },
    { id: 'e4', source: 'wait_1', target: 'end_1' },
    { id: 'e5', source: 'action_1', target: 'end_1' },
  ],
  selectedNodeId: null,
  isDirty: false,
  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),
  selectNode: (id) => set({ selectedNodeId: id }),
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node], isDirty: true })),
  markClean: () => set({ isDirty: false }),
}));
`,

  // Components: Builder
  'apps/web/features/workflows/components/builder/BuilderShell.tsx': `'use client';

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
`,

  'apps/web/features/workflows/components/builder/WorkflowCanvas.tsx': `'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useBuilderStore } from '../../stores/builder.store';
import { TriggerNode } from './nodes/TriggerNode';
import { ActionNode } from './nodes/ActionNode';
import { WaitNode } from './nodes/WaitNode';
import { ConditionNode } from './nodes/ConditionNode';
import { GoalNode } from './nodes/GoalNode';
import { EndNode } from './nodes/EndNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  wait: WaitNode,
  condition: ConditionNode,
  goal: GoalNode,
  end: EndNode,
};

export function WorkflowCanvas() {
  const { nodes, edges, setNodes, setEdges, selectNode } = useBuilderStore();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(applyNodeChanges(changes, nodes as any) as any);
    },
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, edges as any) as any);
    },
    [edges, setEdges]
  );

  return (
    <div className="h-full w-full bg-slate-50">
      <ReactFlow
        nodes={nodes as any}
        edges={edges as any}
        nodeTypes={nodeTypes as any}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
      >
        <Background color="#cbd5e1" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
`,

  'apps/web/features/workflows/components/builder/NodePalette.tsx': `'use client';

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
          className={\`p-2.5 rounded border text-xs font-semibold cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition \${item.bg}\`}
        >
          {item.label}
        </div>
      ))}
    </aside>
  );
}
`,

  'apps/web/features/workflows/components/builder/InspectorPanel.tsx': `'use client';

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
`,

  // Custom Node Components
  'apps/web/features/workflows/components/builder/nodes/TriggerNode.tsx': `'use client';

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
`,

  'apps/web/features/workflows/components/builder/nodes/ActionNode.tsx': `'use client';

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
`,

  'apps/web/features/workflows/components/builder/nodes/WaitNode.tsx': `'use client';

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
`,

  'apps/web/features/workflows/components/builder/nodes/ConditionNode.tsx': `'use client';

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
`,

  'apps/web/features/workflows/components/builder/nodes/GoalNode.tsx': `'use client';

import { Handle, Position } from '@xyflow/react';

export function GoalNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-pink-500 text-white text-xs font-semibold border border-pink-600 min-w-[140px] text-center">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-pink-700" />
      <div className="text-[10px] uppercase tracking-wide opacity-80">Goal</div>
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-pink-700" />
    </div>
  );
}
`,

  'apps/web/features/workflows/components/builder/nodes/EndNode.tsx': `'use client';

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
`,

  // API wrappers
  'apps/web/features/workflows/api/workflows-api.ts': `const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchWorkflows() {
  const res = await fetch(\`\${API_BASE}/workflows\`);
  if (!res.ok) throw new Error('Failed to fetch workflows');
  return res.json();
}

export async function createWorkflow(data: { name: string; description: string }) {
  const res = await fetch(\`\${API_BASE}/workflows\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create workflow');
  return res.json();
}
`,

  // Hooks
  'apps/web/features/workflows/hooks/use-workflows.ts': `'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWorkflows, createWorkflow } from '../api/workflows-api';

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}
`,
};
