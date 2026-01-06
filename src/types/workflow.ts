import { Node, Edge } from 'reactflow';

export type WorkflowNodeType = 'start' | 'action' | 'condition' | 'end';

export interface WorkflowNodeData {
  label: string;
  description?: string;
  type: WorkflowNodeType;
  config?: Record<string, any>;
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  nodes: string;
  edges: string;
  folderId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderData {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreeItem {
  id: string;
  type: 'folder' | 'workflow';
  name: string;
  children?: TreeItem[];
  parentId?: string | null;
  workflow?: WorkflowData;
}
