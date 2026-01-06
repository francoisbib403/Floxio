'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkflowEditor } from '@/components/workflow/WorkflowEditor';
import { WorkflowData } from '@/types/workflow';

export default function EditorPage() {
  const router = useRouter();
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createNewWorkflow = async () => {
      try {
        // Create a new workflow immediately with a generated ID
        const res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: 'Nouveau workflow',
            description: '',
            nodes: '[]',
            edges: '[]',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setWorkflow(data);
          // Update URL without redirecting
          window.history.replaceState({}, '', `/editor/${data.id}`);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Failed to create workflow:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    createNewWorkflow();
  }, [router]);

  const handleClose = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Création du workflow...</p>
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
