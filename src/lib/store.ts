import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';

export type NodeType = 'npc_dialogue' | 'player_response' | 'conditional' | 'skill_check' | 'script_action';

export interface DialogueNodeData {
  speaker?: string;
  text?: string;
  conditions?: string;
  skillCheck?: string;
  effect?: string;
  customId?: string;
  label?: string; // used for general display
  [key: string]: any;
}

export type DialogueNode = Node<DialogueNodeData>;

export interface ProjectState {
  name: string;
  author: string;
  version: string;
  theme: 'pip-boy-green' | 'pip-boy-amber';
  crtEffect: boolean;
  viewMode: 'graph' | 'linear';
}

export interface DialogueState {
  project: ProjectState;
  nodes: DialogueNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType, position: { x: number, y: number }, parentNodeId?: string) => void;
  updateNodeData: (id: string, data: Partial<DialogueNodeData>) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  updateProject: (data: Partial<ProjectState>) => void;
  loadProject: (projectJson: any) => void;
  clearProject: () => void;
  addNodesAndEdges: (newNodes: DialogueNode[], newEdges: Edge[]) => void;
}

export const useStore = create<DialogueState>((set, get) => ({
  project: {
    name: 'Vault13Dialogue',
    author: 'Modder',
    version: '1.0',
    theme: 'pip-boy-green',
    crtEffect: true,
    viewMode: 'graph'
  },
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => {
    set((state) => {
      const removedIds = changes.filter((c) => c.type === 'remove').map((c: any) => c.id);
      let newEdges = state.edges;
      if (removedIds.length > 0) {
        newEdges = state.edges.filter(
          (edge) => !removedIds.includes(edge.source) && !removedIds.includes(edge.target)
        );
      }
      return {
        nodes: applyNodeChanges(changes, state.nodes),
        edges: newEdges,
      };
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  addNode: (type, position, parentNodeId) => {
    const id = uuidv4();
    const newNode: DialogueNode = {
      id,
      type: 'customNode', // We will register one custom node component that switches inside
      position,
      data: {
        type, // Stores the actual type
        speaker: type === 'npc_dialogue' ? 'Vault Overseer' : '',
        text: type === 'player_response' ? 'Player choice here...' : 'Dialogue text here...',
        label: type,
        customId: '',
      },
      className: 'fallout-node-container',
    };
    
    set((state) => {
      const newEdges = parentNodeId ? [...state.edges, { id: uuidv4(), source: parentNodeId, target: id }] : state.edges;
      return { nodes: [...state.nodes, newNode], edges: newEdges, selectedNodeId: id };
    });
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  setSelectedNode: (id) => {
    set({ selectedNodeId: id });
  },

  updateProject: (data) => {
    set({ project: { ...get().project, ...data } });
  },

  loadProject: (projectJson) => {
    try {
      const { project, nodes, edges } = projectJson;
      set({ 
        project: project || get().project, 
        nodes: nodes || [], 
        edges: edges || [],
        selectedNodeId: null 
      });
    } catch (error) {
      console.error("Failed to parse project JSON", error);
    }
  },

  clearProject: () => {
    set({
      project: {
        name: 'NewProject',
        author: '',
        version: '1.0',
        theme: 'pip-boy-green',
        crtEffect: true,
        viewMode: 'graph'
      },
      nodes: [],
      edges: [],
      selectedNodeId: null,
    });
  },

  addNodesAndEdges: (newNodes, newEdges) => {
    set({
      nodes: [...get().nodes, ...newNodes],
      edges: [...get().edges, ...newEdges],
    });
  }
}));
