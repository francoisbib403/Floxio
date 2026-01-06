'use client';

import { create } from 'zustand';
import { Node, Edge, addEdge, Connection, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';

export interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  nodes: string; // JSON string
  edges: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowState {
  // Current workflow being edited
  currentWorkflow: WorkflowData | null;
  nodes: Node[];
  edges: Edge[];

  // Dashboard state
  workflows: WorkflowData[];
  isEditorOpen: boolean;

  // AI sidebar state
  isAISidebarOpen: boolean;

  // Actions
  setCurrentWorkflow: (workflow: WorkflowData | null) => void;
  setWorkflows: (workflows: WorkflowData[]) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  setIsEditorOpen: (open: boolean) => void;
  toggleAISidebar: () => void;
  setAISidebarOpen: (open: boolean) => void;
  resetWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  // Initial state
  currentWorkflow: null,
  nodes: [],
  edges: [],
  workflows: [],
  isEditorOpen: false,
  isAISidebarOpen: true,

  // Actions
  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),

  setWorkflows: (workflows) => set({ workflows }),

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(connection, state.edges),
    })),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    })),

  setIsEditorOpen: (open) => set({ isEditorOpen: open }),

  toggleAISidebar: () => set((state) => ({ isAISidebarOpen: !state.isAISidebarOpen })),

  setAISidebarOpen: (open) => set({ isAISidebarOpen: open }),

  resetWorkflow: () =>
    set({
      currentWorkflow: null,
      nodes: [],
      edges: [],
    }),
}));
