'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FolderData, TreeItem, WorkflowData } from '@/types/workflow';
import { Plus, Folder, FileText, ChevronRight, MoreVertical, FolderOpen, Trash2, Edit3, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  DragOverlay,
} from '@dnd-kit/core';

interface WorkflowDashboardProps {
  onCreateWorkflow: () => void;
  onSelectWorkflow: (workflow: WorkflowData) => void;
}

interface CardItem {
  id: string;
  type: 'folder' | 'workflow';
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  folderId?: string | null;
  workflow?: WorkflowData;
}

export function WorkflowDashboard({ onCreateWorkflow, onSelectWorkflow }: WorkflowDashboardProps) {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [foldersRes, workflowsRes] = await Promise.all([
        fetch('/api/folders'),
        fetch('/api/workflows'),
      ]);

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData);
      }

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const buildHorizontalLayout = (items: CardItem[]): CardItem[] => {
    if (typeof window === 'undefined') return items;
    const ITEM_WIDTH = 280;
    const ITEM_HEIGHT = 140; // Fixed height for consistency
    const GAP = 16;
    const CONTAINER_PADDING = 24;
    const availableWidth = window.innerWidth - CONTAINER_PADDING * 2;
    const itemsPerRow = Math.floor((availableWidth + GAP) / (ITEM_WIDTH + GAP));

    items.forEach((item, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      item.x = col * (ITEM_WIDTH + GAP);
      item.y = row * (ITEM_HEIGHT + GAP);
      item.width = ITEM_WIDTH;
      item.height = ITEM_HEIGHT;
    });

    return items;
  };

  const getCardWidth = (item: { name: string }): number => {
    const nameLength = item.name.length;
    const baseWidth = 280;
    const charWidth = 9;
    const padding = 64;
    return Math.min(Math.max(baseWidth, nameLength * charWidth + padding), 400);
  };

  const getAllItems = (): CardItem[] => {
    const items: CardItem[] = [];

    // Ajouter les dossiers racines
    const rootFolders = folders.filter(f => !f.parentId);
    rootFolders.forEach(folder => {
      items.push({
        id: folder.id,
        type: 'folder',
        name: folder.name,
        width: getCardWidth({ name: folder.name }),
        height: 120,
        x: 0,
        y: 0,
        folderId: null,
      });
    });

    // Ajouter les workflows sans dossier
    const workflowsWithoutFolder = workflows.filter(w => !w.folderId);
    workflowsWithoutFolder.forEach(workflow => {
      items.push({
        id: workflow.id,
        type: 'workflow',
        name: workflow.name,
        width: getCardWidth({ name: workflow.name }),
        height: 140,
        x: 0,
        y: 0,
        folderId: null,
        workflow,
      });
    });

    return items;
  };

  const buildFolderChildren = (folderId: string): CardItem[] => {
    const items: CardItem[] = [];

    // Ajouter les sous-dossiers
    const childFolders = folders.filter(f => f.parentId === folderId);
    childFolders.forEach(folder => {
      items.push({
        id: folder.id,
        type: 'folder',
        name: folder.name,
        width: getCardWidth({ name: folder.name }),
        height: 120,
        x: 0,
        y: 0,
        folderId,
      });
    });

    // Ajouter les workflows dans ce dossier
    const workflowsInFolder = workflows.filter(w => w.folderId === folderId);
    workflowsInFolder.forEach(workflow => {
      items.push({
        id: workflow.id,
        type: 'workflow',
        name: workflow.name,
        width: getCardWidth({ name: workflow.name }),
        height: 140,
        x: 0,
        y: 0,
        folderId,
        workflow,
      });
    });

    return items;
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggingId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Si on dépose sur un dossier
    const targetFolder = folders.find(f => f.id === overId);
    if (targetFolder) {
      try {
        await fetch(`/api/workflows/${activeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId: overId }),
        });
        await loadData();
      } catch (error) {
        console.error('Failed to move workflow:', error);
      }
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      await loadData();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Supprimer ce dossier et tous ses workflows ?')) return;

    try {
      await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });
      await loadData();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    try {
      await fetch(`/api/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      await loadData();
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const Card = ({ item }: { item: CardItem }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: item.id,
      data: { type: item.type },
    });

    if (item.type === 'folder') {
      return (
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          onClick={() => toggleFolder(item.id)}
          className="absolute cursor-pointer"
          style={{
            left: item.x,
            top: item.y,
            width: item.width,
            height: item.height,
          }}
        >
          <div
            className={`h-full rounded-lg border-2 transition-all ${
              isDragging
                ? 'border-gray-400 shadow-xl scale-105 opacity-70'
                : 'border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300 hover:scale-102'
            } bg-white`}
          >
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-start justify-between mb-2">
                {expandedFolders.has(item.id) ? (
                  <FolderOpen className="w-6 h-6 text-gray-500" />
                ) : (
                  <Folder className="w-6 h-6 text-gray-500" />
                )}
                <FolderActionsMenu
                  id={item.id}
                  name={item.name}
                  onRename={handleRenameFolder}
                  onDelete={handleDeleteFolder}
                />
              </div>
              <h3 className="font-semibold text-gray-900 text-base leading-tight">
                {item.name}
              </h3>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={() => item.workflow && onSelectWorkflow(item.workflow)}
        className="absolute cursor-pointer"
        style={{
          left: item.x,
          top: item.y,
          width: item.width,
          height: item.height,
        }}
      >
        <div
          className={`h-full rounded-lg border-2 transition-all ${
            isDragging
              ? 'border-gray-400 shadow-xl scale-105 opacity-70'
              : 'border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300 hover:scale-102'
          } bg-white`}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <FileText className="w-6 h-6 text-gray-500" />
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(item.workflow!.updatedAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1">
              {item.name}
            </h3>
            {item.workflow?.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {item.workflow.description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const allItems = getAllItems();
  buildHorizontalLayout(allItems);

  // Rendre les dossiers et workflows racines
  const rootFolders = folders.filter(f => !f.parentId);
  const rootWorkflows = workflows.filter(w => !w.folderId);

  const allRootItems = [
    ...rootFolders.map(f => ({
      id: f.id,
      type: 'folder' as const,
      name: f.name,
      width: getCardWidth({ name: f.name }),
      height: 120,
      x: 0,
      y: 0,
    })),
    ...rootWorkflows.map(w => ({
      id: w.id,
      type: 'workflow' as const,
      name: w.name,
      width: getCardWidth({ name: w.name }),
      height: 140,
      x: 0,
      y: 0,
      workflow: w,
    })),
  ];

  // Rendre les contenus des dossiers ouverts
  const folderContents: Array<{ folderId: string; items: CardItem[] }> = [];
  expandedFolders.forEach(folderId => {
    const children = buildFolderChildren(folderId);
    if (children.length > 0) {
      buildHorizontalLayout(children);
      folderContents.push({ folderId, items: children });
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Floxio Prototype</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Créez et gérez vos workflows simplement
                </p>
              </div>
              <Button onClick={onCreateWorkflow} className="bg-gray-900 hover:bg-gray-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Créer un workflow
              </Button>
            </div>
          </div>
        </header>
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Créez et gérez vos workflows simplement
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-10 w-64"
                  />
                </div>
                <CreateFolderDialog onCreateFolder={handleCreateFolder} />
                <Button onClick={onCreateWorkflow} className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un workflow
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {allRootItems.length === 0 && folderContents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun workflow
              </h3>
              <p className="text-gray-500 mb-6">
                Commencez par créer votre premier workflow ou dossier
              </p>
              <div className="flex gap-2 justify-center">
                <CreateFolderDialog onCreateFolder={handleCreateFolder} />
                <Button onClick={onCreateWorkflow} className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un workflow
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Cartes racines */}
              <div
                className="relative transition-all duration-300"
                style={{
                  minHeight: `${Math.max(...allRootItems.map(i => i.y + i.height))}px`,
                }}
              >
                {allRootItems.map(item => <Card key={item.id} item={item} />)}
              </div>

              {/* Contenus des dossiers ouverts */}
              {folderContents.map(({ folderId, items }) => (
                <div
                  key={folderId}
                  className="mt-8"
                  style={{
                    minHeight: `${Math.max(...items.map(i => i.y + i.height))}px`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FolderOpen className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold text-gray-700">
                      {folders.find(f => f.id === folderId)?.name}
                    </span>
                    <div className="h-px flex-1 bg-gray-300" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFolder(folderId)}
                      className="w-7 h-7"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                  <div className="relative transition-all duration-300">
                    {items.map(item => <Card key={item.id} item={item} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg shadow-xl border border-gray-300">
              {workflows.find(w => w.id === activeId)?.name ||
               folders.find(f => f.id === activeId)?.name}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

interface CreateFolderDialogProps {
  onCreateFolder: (name: string) => void;
}

function CreateFolderDialog({ onCreateFolder }: CreateFolderDialogProps) {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);

  const handleCreate = () => {
    if (name.trim()) {
      onCreateFolder(name.trim());
      setName('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Folder className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un dossier</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nom du dossier"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} className="w-full bg-gray-900 hover:bg-gray-800 text-white">
            Créer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FolderActionsMenuProps {
  id: string;
  name: string;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

function FolderActionsMenu({
  id,
  name,
  onRename,
  onDelete,
}: FolderActionsMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(name);
  const [open, setOpen] = useState(false);

  const handleRename = () => {
    if (newName.trim() && newName !== name) {
      onRename(id, newName.trim());
    }
    setIsRenaming(false);
    setOpen(false);
  };

  const handleDelete = () => {
    onDelete(id);
    setOpen(false);
  };

  return (
    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
      {isRenaming ? (
        <Input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={e => {
            if (e.key === 'Enter') handleRename();
            else if (e.key === 'Escape') {
              setIsRenaming(false);
              setNewName(name);
            }
          }}
          className="h-8 text-sm"
          autoFocus
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={e => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
          >
            <Edit3 className="w-3 h-3 text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={e => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </>
      )}
    </div>
  );
}
