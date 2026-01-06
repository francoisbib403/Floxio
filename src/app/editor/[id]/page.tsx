'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { WorkflowEditor } from '@/components/workflow/WorkflowEditor';
import { WorkflowData } from '@/types/workflow';

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  // Update workflowId when params change
  useEffect(() => {
    if (params.id) {
      setWorkflowId(params.id as string);
    }
  }, [params.id]);

  const loadWorkflow = useCallback(async () => {
    if (!workflowId) return;

    setLoading(true);
    setError(false);

    let retries = 3;
    
    const tryLoad = async () => {
      try {
        const res = await fetch(`/api/workflows/${workflowId}`);
        if (res.ok) {
          const data = await res.json();
          setWorkflow(data);
          setLoading(false);
        } else if (retries > 0) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 500));
          tryLoad();
        } else {
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load workflow:', err);
        if (retries > 0) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 500));
          tryLoad();
        } else {
          setError(true);
          setLoading(false);
        }
      }
    };

    tryLoad();
  }, [workflowId]);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow();
    }
  }, [workflowId, loadWorkflow]);

  const handleClose = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-gray-500">Workflow non trouvé</p>
        <button
          onClick={() => router.push('/editor')}
          className="px-4 py-2 bg-gray-900 text-white rounded"
        >
          Créer un nouveau workflow
        </button>
      </div>
    );
  }

  return (
    <WorkflowEditor
      workflow={workflow}
      onBack={handleClose}
    />
  );
}
