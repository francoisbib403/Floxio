'use client';

import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  ConnectionMode,
  Connection,
  Edge,
  Node,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { WorkflowNodeData } from '@/types/workflow';

const nodeTypes = {
  custom: CustomNode,
};

interface WorkflowCanvasProps {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node<WorkflowNodeData>) => void;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
}: WorkflowCanvasProps) {
  // Convert edges to have proper markers
  const processedEdges = edges.map((edge) => ({
    ...edge,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#6b7280',
    },
    style: {
      strokeWidth: 2,
      stroke: '#6b7280',
    },
  }));

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={processedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls position="bottom-right" className="border border-gray-300 bg-white" />
      </ReactFlow>
    </div>
  );
}
