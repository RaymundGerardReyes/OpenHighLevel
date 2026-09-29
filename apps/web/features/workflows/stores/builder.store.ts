import { create } from 'zustand';

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
