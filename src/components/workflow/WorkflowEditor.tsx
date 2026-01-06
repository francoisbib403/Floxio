'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkflowCanvas } from './WorkflowCanvas';
import { AISidebar } from './AISidebar';
import { WorkflowData, useWorkflowStore } from '@/stores/workflow-store';
import { ChatMessage, WorkflowNode, WorkflowEdge } from '@/types/workflow';
import { ArrowLeft, Save, Sparkles, LayoutTemplate } from 'lucide-react';
import { layoutWorkflow } from '@/lib/workflow-layout';

interface WorkflowEditorProps {
  workflow: WorkflowData | null;
  onBack: () => void;
}

export function WorkflowEditor({ workflow, onBack }: WorkflowEditorProps) {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    toggleAISidebar,
    isAISidebarOpen,
    setCurrentWorkflow,
  } = useWorkflowStore();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workflowName, setWorkflowName] = useState(workflow?.name || '');
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '');
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (workflow) {
      setCurrentWorkflow(workflow);
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
      try {
        const parsedNodes: WorkflowNode[] = JSON.parse(workflow.nodes);
        const parsedEdges: WorkflowEdge[] = JSON.parse(workflow.edges);
        setNodes(parsedNodes);
        setEdges(parsedEdges);
      } catch (error) {
        console.error('Failed to parse workflow data:', error);
        setNodes([]);
        setEdges([]);
      }
    } else {
      setCurrentWorkflow(null);
      setNodes([]);
      setEdges([]);
      setWorkflowName('Nouveau workflow');
      setWorkflowDescription('');
    }
  }, [workflow, setCurrentWorkflow, setNodes, setEdges]);

  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/workflows/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          currentWorkflow: workflow ? {
            id: workflow.id,
            name: workflow.name,
            nodes: workflow.nodes,
            edges: workflow.edges,
          } : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.message) {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          };
          setChatMessages((prev) => [...prev, assistantMessage]);
        }

        if (data.workflow) {
          const { nodes: newNodes, edges: newEdges } = data.workflow;
          // Appliquer le layout automatique pour organiser les nœuds
          const { nodes: organizedNodes } = layoutWorkflow(newNodes, newEdges);
          setNodes(organizedNodes);
          setEdges(newEdges);
          setHasChanges(true);
        }
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.',
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Une erreur est survenue. Veuillez réessayer.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!workflow) return;
    
    try {
      const payload = {
        name: workflowName,
        description: workflowDescription,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      };

      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setHasChanges(false);
        alert('Workflow sauvegardé avec succès !');
      } else {
        alert('Erreur lors de la sauvegarde du workflow');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Erreur lors de la sauvegarde du workflow');
    }
  };

  const handleAutoLayout = () => {
    const { nodes: organizedNodes } = layoutWorkflow(nodes, edges);
    setNodes(organizedNodes);
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 max-w-md">
              <Input
                value={workflowName}
                onChange={(e) => {
                  setWorkflowName(e.target.value);
                  setHasChanges(true);
                }}
                className="font-semibold text-gray-900"
                placeholder="Nom du workflow"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-sm text-gray-500">Modifications non sauvegardées</span>
            )}
            <Button
              onClick={handleAutoLayout}
              variant="outline"
              title="Réorganiser le workflow"
            >
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Réorganiser
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`${hasChanges ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI Sidebar */}
        {isAISidebarOpen && (
          <div className="w-96 flex-shrink-0">
            <AISidebar
              isOpen={isAISidebarOpen}
              onClose={toggleAISidebar}
              onSendMessage={handleSendMessage}
              messages={chatMessages}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Workflow Canvas */}
        <div className="flex-1 relative">
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          />
        </div>
      </div>

      {/* Floating AI Button (when sidebar is closed) */}
      {!isAISidebarOpen && (
        <Button
          onClick={toggleAISidebar}
          className="fixed bottom-6 left-6 bg-gray-900 hover:bg-gray-800 text-white shadow-lg rounded-full w-14 h-14"
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}
