import { useStore, NodeType } from '../lib/store';
import { Button } from '@/components/ui/button';
import { User, MessageSquare, AlertCircle, Zap, Code } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import AIGenerator from './AIGenerator';

export default function Sidebar() {
  const addNode = useStore((state) => state.addNode);

  const onAddNode = (type: NodeType) => {
    const x = Math.floor(Math.random() * 50) + 100;
    const y = Math.floor(Math.random() * 50) + 100;
    addNode(type, { x, y });
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const nodeTypes = [
    { type: 'npc_dialogue', label: 'NPC Dialogue', icon: User, color: 'text-primary' },
    { type: 'player_response', label: 'Player Response', icon: MessageSquare, color: 'text-blue-500' },
    { type: 'conditional', label: 'Branch / Condition', icon: AlertCircle, color: 'text-yellow-500' },
    { type: 'skill_check', label: 'Skill Check', icon: Zap, color: 'text-purple-500' },
    { type: 'script_action', label: 'Script Action', icon: Code, color: 'text-orange-500' },
  ];

  return (
    <div className="w-64 border-r border-primary bg-muted/95 backdrop-blur flex flex-col">
      <div className="p-4 border-b border-primary/30 bg-card">
        <h2 className="uppercase font-bold tracking-widest text-sm flex items-center gap-2">
          Node Palette
        </h2>
        <p className="text-xs opacity-60 mt-1">Select to construct logic.</p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-3">
          {nodeTypes.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(event) => onDragStart(event, item.type)}
            >
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 bg-secondary hover:bg-secondary/80 border-primary/30 cursor-grab"
                onClick={() => onAddNode(item.type as NodeType)}
              >
                <item.icon className={`w-5 h-5 mr-3 ${item.color}`} />
                <div className="text-left font-mono tracking-wider">
                  <div className="text-sm uppercase font-bold">{item.label}</div>
                  <div className="text-[9px] opacity-60 mt-1 uppercase italic">Click to add</div>
                </div>
              </Button>
            </div>
          ))}
        </div>
        <AIGenerator />
        <div className="mt-8">
          <div className="text-xs uppercase tracking-widest opacity-50 mb-2 pb-1 border-b border-primary/20">Mini-Map</div>
          <div className="text-[10px] opacity-40">
            [SYS_MSG] Real-time geographic visualization reserved. Use canvas mapping.
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
