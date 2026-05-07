import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { clsx } from 'clsx';
import { MessageSquare, User, AlertCircle, Zap, Code, ShieldAlert } from 'lucide-react';

const typeIcons: Record<string, React.FC<any>> = {
  npc_dialogue: User,
  player_response: MessageSquare,
  conditional: AlertCircle,
  skill_check: Zap,
  script_action: Code,
};

const typeColors: Record<string, string> = {
  npc_dialogue: 'border-primary bg-primary/10 text-primary',
  player_response: 'border-blue-500 bg-blue-500/10 text-blue-400',
  conditional: 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  skill_check: 'border-purple-500 bg-purple-500/10 text-purple-400',
  script_action: 'border-orange-500 bg-orange-500/10 text-orange-500',
};

const typeShapes: Record<string, string> = {
  npc_dialogue: 'rounded-none',
  player_response: 'rounded-xl',
  conditional: 'rounded-bl-3xl border-l-[6px]',
  skill_check: 'rounded-tr-3xl border-t-[6px]',
  script_action: 'rounded-none border-dashed',
};

export default function CustomNode({
  id,
  data,
  isConnectable,
  selected,
}: {
  id: string;
  data: any;
  isConnectable: boolean;
  selected: boolean;
}) {
  const { type, text, speaker, customId, hasError } = data;
  const Icon = typeIcons[type] || MessageSquare;
  const typeColor = typeColors[type] || typeColors.npc_dialogue;
  const shape = typeShapes[type] || 'rounded-none';

  return (
    <div
      className={clsx(
        'min-w-[200px] max-w-[250px] shadow-[0_0_15px_rgba(77,255,77,0.1)] border-2 backdrop-blur-md',
        shape,
        hasError ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(255,0,0,0.5)]' : typeColor,
        selected ? `ring-2 ring-white/50 scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.2)]` : 'ring-0',
        'transition-all cursor-pointer bg-card group'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className={clsx(
          "w-4 h-4 bg-secondary border-2 transition-colors",
          hasError ? "border-red-500" : "border-primary/50 group-hover:border-primary"
        )}
      />
      
      <div className={clsx(
        "flex items-center gap-2 p-2 border-b bg-background/80 transition-colors",
        hasError ? "border-red-500 text-red-500" : "border-inherit"
      )}>
        {hasError ? <ShieldAlert className="w-4 h-4 animate-pulse" /> : <Icon className="w-4 h-4" />}
        <span className="text-xs uppercase font-bold tracking-wider truncate flex-1 leading-none pt-0.5">
          {type.replace('_', ' ')}
        </span>
        {customId && (
          <span className="text-[10px] opacity-80 bg-black/60 px-1.5 py-0.5 rounded font-mono border border-current/20">
            #{customId}
          </span>
        )}
      </div>
      
      <div className="p-3 text-sm bg-background/90 text-foreground font-mono">
        {type === 'npc_dialogue' && (
          <div className="text-[10px] uppercase opacity-70 mb-1 border-b border-primary/20 pb-1 inline-block">
            {speaker || 'Unknown'}
          </div>
        )}
        {(type === 'skill_check' || type === 'conditional') && (
          <div className="text-[10px] uppercase opacity-70 mb-1 font-bold">
            Condition / Check
          </div>
        )}
        {type === 'script_action' && (
          <div className="text-[10px] uppercase opacity-70 mb-1 font-bold">
            Execute Script
          </div>
        )}
        <div className={clsx(
          "line-clamp-4 leading-snug",
          type === 'script_action' ? 'text-orange-400/90 italic' : 'text-white/90',
          hasError && 'text-red-300'
        )}>
          {text || '<Empty Node>'}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className={clsx(
          "w-4 h-4 bg-primary border-2 transition-colors",
          hasError ? "border-red-500" : "border-primary/50 group-hover:border-primary"
        )}
      />
    </div>
  );
}
