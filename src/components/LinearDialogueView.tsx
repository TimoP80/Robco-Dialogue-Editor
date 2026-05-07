import * as React from 'react';
import { useStore, DialogueNode } from '../lib/store';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function LinearDialogueView() {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const setSelectedNodeId = useStore((state) => state.setSelectedNode);
  const selectedNodeId = useStore((state) => state.selectedNodeId);

  // Use DFS to order nodes logically based on dialogue flow
  const sortedNodes: DialogueNode[] = [];
  const visited = new Set<string>();

  // Find root nodes (no incoming edges)
  const targetIds = new Set(edges.map(e => e.target));
  let rootNodes = nodes.filter(n => !targetIds.has(n.id));

  // If a graph has only cycles, just try starting from an npc_dialogue
  if (rootNodes.length === 0 && nodes.length > 0) {
    const npcNodes = nodes.filter(n => n.data.type === 'npc_dialogue');
    rootNodes = npcNodes.length > 0 ? [npcNodes[0]] : [nodes[0]];
  }

  const dfs = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    sortedNodes.push(node);
    
    // Sort edges so we have deterministic ordering (e.g. choices top-to-bottom based on Y position if possible, or ID)
    const outgoingEdges = edges.filter(e => e.source === nodeId);
    const targetNodes = outgoingEdges
      .map(e => nodes.find(n => n.id === e.target))
      .filter((n): n is DialogueNode => n !== undefined);
      
    // Attempt to maintain a stable read order
    targetNodes.sort((a, b) => {
        const aid = String(a.data.customId || a.id);
        const bid = String(b.data.customId || b.id);
        return aid.localeCompare(bid);
    });

    targetNodes.forEach(tNode => {
      dfs(tNode.id);
    });
  };

  rootNodes.forEach(rn => dfs(rn.id));

  // Pick up any disconnected subgraphs
  nodes.forEach(n => {
    if (!visited.has(n.id)) dfs(n.id);
  });

  return (
    <div className="flex-1 bg-background h-full overflow-hidden flex flex-col font-mono text-foreground p-8 min-w-0 min-h-0">
      <div className="mb-6 pb-4 border-b border-primary/30 flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-primary mb-1">Linear Transcript</h2>
          <div className="text-xs opacity-50 uppercase">Displaying nodes in dialogue flow order</div>
        </div>
        <div className="text-xs uppercase opacity-70">
          Total Nodes: {nodes.length}
        </div>
      </div>

      <ScrollArea className="flex-1 w-full h-full pr-4 min-h-0">
        <div className="space-y-6 pb-20 max-w-4xl mx-auto">
          {sortedNodes.map((node) => {
            const isNPC = node.data.type === 'npc_dialogue';
            const isPlayer = node.data.type === 'player_response';
            
            // Find children to display clear connections
            const outgoingEdges = edges.filter(e => e.source === node.id);
            const childIds = outgoingEdges.map(e => nodes.find(n => n.id === e.target)?.data.customId || '[Unknown]');

            return (
              <div 
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`border p-4 transition-all cursor-pointer ${selectedNodeId === node.id ? 'border-primary bg-primary/10' : 'border-primary/30 bg-card hover:border-primary/60'} ${isPlayer ? 'ml-12' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <span className={`px-1 py-0.5 border rounded-none text-[10px] ${isNPC ? 'border-primary text-primary' : isPlayer ? 'border-accent text-accent' : 'border-muted-foreground text-muted-foreground'}`}>
                      {node.data.type.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold bg-primary/20 text-primary px-1">ID: {node.data.customId || 'N/A'}</span>
                    {isNPC && <span className="text-xs opacity-70"> SPEAKER: {node.data.speaker || 'UNKNOWN'}</span>}
                  </div>
                </div>

                <div className={`text-sm my-3 pl-3 border-l-2 ${isPlayer ? 'border-accent text-foreground/90' : 'border-primary text-primary'}`}>
                  {node.data.text || <span className="opacity-30 italic">[No text]</span>}
                </div>

                {childIds.length > 0 ? (
                  <div className="mt-4 pt-2 border-t border-primary/20 text-[10px] text-muted-foreground uppercase flex gap-2 flex-wrap items-center">
                     <span>Links to:</span>
                     {childIds.map((cid, i) => (
                       <span key={i} className="bg-secondary px-1 text-primary">{cid}</span>
                     ))}
                  </div>
                ) : (
                  <div className="mt-4 pt-2 border-t border-primary/20 text-[10px] text-muted-foreground uppercase opacity-50">
                     [End of path]
                  </div>
                )}
                
                {selectedNodeId === node.id && (
                   <div className="mt-4 pt-2 flex gap-2 flex-wrap border-t border-primary/30">
                     <span className="text-[10px] uppercase opacity-70 w-full mb-1">Append Node:</span>
                     <button className="text-[10px] bg-secondary hover:bg-primary hover:text-background text-primary px-2 py-1 uppercase" onClick={(e) => { e.stopPropagation(); useStore.getState().addNode('npc_dialogue', { x: node.position.x, y: node.position.y + 150 }, node.id); }}>+ NPC</button>
                     <button className="text-[10px] bg-secondary hover:bg-primary hover:text-background text-primary px-2 py-1 uppercase" onClick={(e) => { e.stopPropagation(); useStore.getState().addNode('player_response', { x: node.position.x, y: node.position.y + 150 }, node.id); }}>+ Player</button>
                     <button className="text-[10px] bg-secondary hover:bg-primary hover:text-background text-primary px-2 py-1 uppercase" onClick={(e) => { e.stopPropagation(); useStore.getState().addNode('script_action', { x: node.position.x, y: node.position.y + 150 }, node.id); }}>+ Script</button>
                   </div>
                )}
              </div>
            );
          })}

          {sortedNodes.length === 0 && (
            <div className="text-center opacity-50 uppercase py-20 border border-dashed border-primary/30">
              No dialogue nodes detected.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
