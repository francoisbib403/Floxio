import { Node, Edge } from 'reactflow';
import { WorkflowNodeData, WorkflowEdge } from '@/types/workflow';

export interface LayoutNode extends Node<WorkflowNodeData> {
  level: number;
  children: string[];
  parent?: string;
}

/**
 * Organise les nœuds d'un workflow de manière structurée
 * - Les nœuds "start" sont au niveau 0 (en haut à gauche)
 * - Les nœuds "action" et "condition" sont répartis sur plusieurs niveaux
 * - Les nœuds "end" sont au dernier niveau (en bas)
 */
export function layoutWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  // Créer une map des nœuds pour un accès rapide
  const nodeMap = new Map<string, LayoutNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      ...node,
      level: -1,
      children: [],
      parent: undefined,
    });
  });

  // Identifier les relations parent-enfant
  edges.forEach((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (sourceNode && targetNode) {
      sourceNode.children.push(edge.target);
      targetNode.parent = edge.source;
    }
  });

  // Assigner les niveaux
  const startNodes = nodes.filter((n) => n.data.type === 'start');
  const endNodes = nodes.filter((n) => n.data.type === 'end');

  // Trouver les nœuds racines (sans parent ou de type start)
  const rootNodes = nodes.filter(
    (n) =>
      n.data.type === 'start' || (!nodeMap.get(n.id)?.parent && !isEndOfPath(n.id, edges))
  );

  // Calculer les niveaux pour tous les nœuds
  const processedNodes = new Set<string>();

  function calculateLevel(nodeId: string, level: number) {
    if (processedNodes.has(nodeId)) {
      return;
    }

    const node = nodeMap.get(nodeId);
    if (!node) {
      return;
    }

    processedNodes.add(nodeId);
    node.level = level;

    // Calculer le niveau des enfants
    node.children.forEach((childId) => {
      calculateLevel(childId, level + 1);
    });
  }

  // Commencer par les nœuds racines
  rootNodes.forEach((root) => {
    calculateLevel(root.id, 0);
  });

  // Si certains nœuds n'ont pas de niveau, les assigner
  nodeMap.forEach((node) => {
    if (node.level === -1) {
      // Nœuds isolés ou non connectés
      node.level = 0;
    }
  });

  // Grouper les nœuds par niveau
  const nodesByLevel = new Map<number, LayoutNode[]>();
  nodeMap.forEach((node) => {
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  });

  // Calculer les positions
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const HORIZONTAL_SPACING = 250;
  const VERTICAL_SPACING = 150;

  const positionedNodes: WorkflowNode[] = [];
  const maxLevel = Math.max(...Array.from(nodesByLevel.keys()));

  nodesByLevel.forEach((levelNodes, level) => {
    const totalWidth = levelNodes.length * NODE_WIDTH + (levelNodes.length - 1) * HORIZONTAL_SPACING;
    const startX = -totalWidth / 2 + NODE_WIDTH / 2;

    levelNodes.forEach((node, index) => {
      const x = startX + index * (NODE_WIDTH + HORIZONTAL_SPACING);
      const y = level * VERTICAL_SPACING + 100; // +100 pour le padding

      positionedNodes.push({
        id: node.id,
        type: node.type,
        position: { x, y },
        data: node.data,
      });
    });
  });

  return {
    nodes: positionedNodes,
    edges,
  };
}

/**
 * Vérifie si un nœud est à la fin d'un chemin (pas de connexions sortantes)
 */
function isEndOfPath(nodeId: string, edges: Edge[]): boolean {
  return !edges.some((edge) => edge.source === nodeId);
}
