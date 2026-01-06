'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Folder,
  FileText,
  MoreVertical,
  Search,
  Plus,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserProfile } from '@/components/UserProfile';

type TabValue = 'workflows' | 'credentials' | 'data-tables';

interface WorkflowItem {
  id: string;
  name: string;
  type: 'folder' | 'workflow';
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'last-updated' | 'created' | 'name'>('last-updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const [foldersRes, workflowsRes] = await Promise.all([
        fetch('/api/folders', { credentials: 'include' }),
        fetch('/api/workflows', { credentials: 'include' }),
      ]);

      const loadedItems: WorkflowItem[] = [];

      if (foldersRes.ok) {
        const folders = await foldersRes.json();
        folders.forEach((folder: any) => {
          loadedItems.push({
            id: folder.id,
            name: folder.name,
            type: 'folder',
            createdAt: new Date(folder.createdAt || Date.now()),
            updatedAt: new Date(folder.updatedAt || Date.now()),
          });
        });
      }

      if (workflowsRes.ok) {
        const workflows = await workflowsRes.json();
        workflows.forEach((workflow: any) => {
          loadedItems.push({
            id: workflow.id,
            name: workflow.name,
            type: 'workflow',
            createdAt: new Date(workflow.createdAt || Date.now()),
            updatedAt: new Date(workflow.updatedAt || Date.now()),
            description: workflow.description,
          });
        });
      }

      setItems(loadedItems);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.type === 'folder' && b.type === 'workflow') return -1;
    if (a.type === 'workflow' && b.type === 'folder') return 1;
    
    let comparison = 0;
    switch (sortBy) {
      case 'last-updated':
        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;
      case 'created':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (value: 'last-updated' | 'created' | 'name') => {
    if (sortBy === value) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortOrder('desc');
    }
  };

  const handleCreateWorkflow = () => {
    router.push('/editor');
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newFolderName.trim() }),
      });

      if (res.ok) {
        setNewFolderName('');
        setFolderDialogOpen(false);
        loadItems();
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Last updated just now';
    } else if (diffInHours < 24) {
      return `Last updated ${formatDistanceToNow(date, { addSuffix: true, locale: fr })}`;
    } else {
      return `Created ${format(date, 'd MMMM', { locale: fr })}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Floxio Prototype</h1>
              <p className="text-sm text-gray-500 mt-1">
                Workflows, credentials and data tables owned by you
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleCreateWorkflow}
                className="bg-gray-900 hover:bg-gray-800 text-white font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create workflow
              </Button>
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList className="h-12 bg-transparent border-b-0 rounded-none p-0">
              <TabsTrigger 
                value="workflows"
                className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 rounded-none px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Workflows
              </TabsTrigger>
              <TabsTrigger 
                value="credentials"
                className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 rounded-none px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Credentials
              </TabsTrigger>
              <TabsTrigger 
                value="data-tables"
                className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 rounded-none px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Data Tables
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows..."
              className="pl-10 h-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort by
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSort('last-updated')}>
                  Last updated {sortBy === 'last-updated' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('created')}>
                  Created {sortBy === 'created' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('name')}>
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="h-10">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <Folder className="w-4 h-4 mr-2" />
                  New folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create new folder</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    className="mb-4"
                  />
                  <Button 
                    onClick={handleCreateFolder} 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    disabled={!newFolderName.trim()}
                  >
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun workflow</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Commencez à créer votre premier workflow pour automatiser vos tâches
            </p>
            <Button 
              onClick={handleCreateWorkflow}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un workflow
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {paginatedItems.map((item) => (
              <WorkflowListItem key={item.id} item={item} />
            ))}
          </div>
        )}

        {!loading && paginatedItems.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total {sortedItems.length}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rows per page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => {
                  setItemsPerPage(Number(v));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

interface WorkflowListItemProps {
  item: WorkflowItem;
}

function WorkflowListItem({ item }: WorkflowListItemProps) {
  const router = useRouter();

  const handleOpen = () => {
    if (item.type === 'workflow') {
      router.push(`/editor/${item.id}`);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Last updated just now';
    } else if (diffInHours < 24) {
      return `Last updated ${formatDistanceToNow(date, { addSuffix: true, locale: fr })}`;
    } else {
      return `Created ${format(date, 'd MMMM', { locale: fr })}`;
    }
  };

  return (
    <div 
      className="group flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={handleOpen}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-shrink-0">
          {item.type === 'folder' ? (
            <Folder className="w-6 h-6 text-gray-500" />
          ) : (
            <FileText className="w-6 h-6 text-gray-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-sm text-gray-500 truncate">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-500 flex-shrink-0">
          <span>{formatDate(item.updatedAt)}</span>
        </div>
      </div>

      <div className="flex-shrink-0 ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpen}>Open</DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
