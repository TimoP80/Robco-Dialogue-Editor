import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore, DialogueNode } from '../lib/store';
import { Terminal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SimulationDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  
  const [currentNode, setCurrentNode] = useState<DialogueNode | null>(null);
  
  useEffect(() => {
    if (open) {
      if (selectedNodeId) {
        const selected = nodes.find(n => n.id === selectedNodeId);
        if (selected) {
          setCurrentNode(selected);
          return;
        }
      }
      
      // Find starting node (no incoming edges, preferably npc_dialogue)
      const targetIds = new Set(edges.map(e => e.target));
      const rootNodes = nodes.filter(n => !targetIds.has(n.id) && n.data.type === 'npc_dialogue');
      
      if (rootNodes.length > 0) {
        setCurrentNode(rootNodes[0]);
      } else if (nodes.length > 0) {
        setCurrentNode(nodes[0]);
      } else {
        setCurrentNode(null);
      }
    }
  }, [open, nodes, edges]);

  // Find valid choices from the current node
  // If current is NPC dialog, its children might be player_responses or other NPC dialogs.
  const childrenEdges = edges.filter(e => e.source === currentNode?.id);
  const childrenNodes = childrenEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean) as DialogueNode[];
  
  const choices = childrenNodes.filter(n => n.data.type === 'player_response');
  const directContinues = childrenNodes.filter(n => n.data.type !== 'player_response');
  
  const handleChoice = (nextNodeId: string) => {
    // If we clicked a player_response, we usually jump to ITS child (the next NPC response)
    // Find where the player_response leads to
    const targetEdges = edges.filter(e => e.source === nextNodeId);
    if (targetEdges.length > 0) {
      const nextTarget = nodes.find(n => n.id === targetEdges[0].target);
      if (nextTarget) {
        setCurrentNode(nextTarget);
        return;
      }
    }
    // If player_response leads nowhere, it's end of dialogue
    setCurrentNode(null);
  };
  
  const handleContinue = (nextNodeId: string) => {
    const nextTarget = nodes.find(n => n.id === nextNodeId);
    if (nextTarget) {
      setCurrentNode(nextTarget);
    } else {
      setCurrentNode(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[70vh] border-primary font-mono bg-background text-foreground flex flex-col p-0 gap-0 overflow-hidden" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }}>
        <DialogHeader className="p-4 border-b border-primary/30 bg-card">
          <DialogTitle className="uppercase tracking-widest text-primary flex items-center gap-2 text-sm">
            <Terminal className="w-4 h-4" /> Simulation Mode Active
          </DialogTitle>
          <DialogDescription className="sr-only">
            Dialogue simulation view 
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {!currentNode ? (
            <div className="flex-1 flex items-center justify-center text-center opacity-50 uppercase flex-col gap-2">
              <div>[ End of Dialogue / No Valid Path ]</div>
              <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>Exit Simulation</Button>
            </div>
          ) : (
            <>
              {/* NPC Display */}
              {currentNode.data.type === 'npc_dialogue' ? (
                <div className="mb-8">
                  <div className="text-secondary-foreground font-bold uppercase mb-2">
                    [{currentNode.data.speaker || 'UNKNOWN'}]
                  </div>
                  <div className="text-lg leading-relaxed border-l-2 border-primary/50 pl-4 py-1 text-primary">
                    {currentNode.data.text}
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <div className="text-accent uppercase mb-2">
                    [SYSTEM/INTERNAL NODE: {currentNode.data.type}]
                  </div>
                  <div className="text-sm opacity-70 border-l-2 border-accent/50 pl-4 py-1">
                    {currentNode.data.text || currentNode.data.label}
                  </div>
                </div>
              )}

              {/* Player Choices */}
              <div className="flex-1 flex flex-col justify-end gap-2 overflow-y-auto mt-auto pt-4 border-t border-primary/20">
                {choices.length > 0 ? (
                  choices.map((choice, i) => (
                    <button
                      key={choice.id}
                      onClick={() => handleChoice(choice.id)}
                      className="text-left w-full hover:bg-primary/20 p-2 rounded transition-colors text-primary flex gap-2 items-start"
                    >
                      <span className="opacity-50">{i + 1}.</span> 
                      <span>{choice.data.text}</span>
                    </button>
                  ))
                ) : directContinues.length > 0 ? (
                  <button
                    onClick={() => handleContinue(directContinues[0].id)}
                    className="text-left w-full hover:bg-primary/20 p-2 rounded transition-colors text-primary flex gap-2 items-start"
                  >
                    <span className="opacity-50">&gt;</span> 
                    <span>[Continue]</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentNode(null)}
                    className="text-left w-full hover:bg-primary/20 p-2 rounded transition-colors text-accent flex gap-2 items-start"
                  >
                    <span className="opacity-50">&gt;</span> 
                    <span>[End Dialogue]</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
