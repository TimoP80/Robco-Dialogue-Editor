import { useStore } from '../lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PropertiesPanel() {
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const nodes = useStore((state) => state.nodes);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const deleteNode = useStore((state) => state.deleteNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-primary bg-background/90 p-6 flex flex-col items-center justify-center text-center opacity-50">
        <div className="animate-pulse mb-4">_NO_NODE_SELECTED_</div>
        <p className="text-xs">Select a node from the canvas to edit its properties.</p>
      </div>
    );
  }

  const { id, data } = selectedNode;

  return (
    <div className="w-80 border-l border-primary bg-muted/95 flex flex-col h-full font-mono">
      <div className="p-4 border-b border-primary/30 flex justify-between items-center bg-card">
        <div>
          <h2 className="uppercase font-bold tracking-widest text-sm flex items-center gap-2">
            Properties
          </h2>
          <div className="text-[10px] opacity-60 truncate max-w-[200px] mt-1">{id}</div>
        </div>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/20" onClick={() => deleteNode(id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest opacity-70">Node Type</Label>
          <div className="text-sm font-bold bg-secondary p-2 border border-primary/30 uppercase">
            {data.type.replace('_', ' ')}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest opacity-70" htmlFor="customId">MSG Line ID</Label>
          <Input 
            id="customId" 
            placeholder="e.g. 100" 
            value={data.customId || ''} 
            onChange={(e) => updateNodeData(id, { customId: e.target.value })}
            className="bg-background border-primary/50"
          />
        </div>

        {data.type === 'npc_dialogue' && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest opacity-70" htmlFor="speaker">Speaker</Label>
            <Input 
              id="speaker" 
              placeholder="Speaker Name" 
              value={data.speaker || ''} 
              onChange={(e) => updateNodeData(id, { speaker: e.target.value })}
              className="bg-background border-primary/50"
            />
          </div>
        )}

        {['npc_dialogue', 'player_response'].includes(data.type) && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest opacity-70" htmlFor="text">Dialogue Text</Label>
            <Textarea 
              id="text" 
              placeholder="Enter text..." 
              value={data.text || ''} 
              onChange={(e) => updateNodeData(id, { text: e.target.value })}
              className="min-h-[150px] bg-background border-primary/50 font-mono text-sm leading-relaxed"
            />
          </div>
        )}

        {['conditional', 'skill_check', 'player_response', 'npc_dialogue'].includes(data.type) && (
          <div className="space-y-2">
            <Separator className="bg-primary/30 my-4" />
            <Label className="text-xs uppercase tracking-widest opacity-70" htmlFor="conditions">Conditions</Label>
            <Input 
              id="conditions" 
              placeholder="e.g. global_var(GVAR_KARMA) > 0" 
              value={data.conditions || ''} 
              onChange={(e) => updateNodeData(id, { conditions: e.target.value })}
              className="bg-background border-primary/50 font-mono text-xs"
            />
          </div>
        )}

        {data.type === 'skill_check' && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest opacity-70" htmlFor="skillCheck">Skill Setup</Label>
            <Input 
              id="skillCheck" 
              placeholder="e.g. SKILL_SPEECH, -20" 
              value={data.skillCheck || ''} 
              onChange={(e) => updateNodeData(id, { skillCheck: e.target.value })}
              className="bg-background border-primary/50 font-mono text-xs"
            />
            <p className="text-[10px] opacity-60">Format: SKILL_NAME, modifier</p>
          </div>
        )}

        {['script_action', 'npc_dialogue', 'player_response'].includes(data.type) && (
          <div className="space-y-2">
            <Separator className="bg-primary/30 my-4" />
            <Label className="text-xs uppercase tracking-widest opacity-70" htmlFor="effect">Resulting Action</Label>
            <Textarea 
              id="effect" 
              placeholder="e.g. set_global_var(1, 1);" 
              value={data.effect || ''} 
              onChange={(e) => updateNodeData(id, { effect: e.target.value })}
              className="h-[80px] bg-background border-primary/50 font-mono text-xs"
            />
          </div>
        )}

        <div className="space-y-2">
          <Separator className="bg-primary/30 my-4" />
          <Label className="text-xs uppercase tracking-widest opacity-70" htmlFor="notes">Notes / Comments</Label>
          <Textarea 
            id="notes" 
            placeholder="Internal developer notes..." 
            value={data.notes || ''} 
            onChange={(e) => updateNodeData(id, { notes: e.target.value })}
            className="h-[60px] bg-background border-primary/50 font-mono text-xs text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
}
