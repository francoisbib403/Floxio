'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { WorkflowNodeData } from '@/types/workflow';
import { Play, Circle, GitBranch, Flag } from 'lucide-react';

export function CustomNode({ data, selected }: NodeProps<WorkflowNodeData>) {
  const getNodeIcon = () => {
    switch (data.type) {
      case 'start':
        return <Play className="w-4 h-4" />;
      case 'action':
        return <Circle className="w-4 h-4" />;
      case 'condition':
        return <GitBranch className="w-4 h-4" />;
      case 'end':
        return <Flag className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getNodeBorderColor = () => {
    switch (data.type) {
      case 'start':
        return selected ? 'border-gray-900' : 'border-gray-400';
      case 'end':
        return selected ? 'border-gray-900' : 'border-gray-400';
      default:
        return selected ? 'border-gray-900' : 'border-gray-300';
    }
  };

  return (
    <div
      className={`px-4 py-3 bg-white border-2 ${getNodeBorderColor()} rounded-lg shadow-sm min-w-[160px] transition-all`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <div className="text-gray-900">{getNodeIcon()}</div>
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{data.label}</div>
          {data.description && (
            <div className="text-xs text-gray-500 mt-1">{data.description}</div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
