import { DialogueNode } from './store';
import { Edge } from '@xyflow/react';

export function getMsgIdMap(nodes: DialogueNode[]): { map: Record<string, number>, sorted: DialogueNode[] } {
  const map: Record<string, number> = {};
  let currentId = 200;
  
  const sorted = [...nodes].sort((a, b) => {
      const aid = String(a.data.customId || '');
      const bid = String(b.data.customId || '');
      const numA = parseInt(aid);
      const numB = parseInt(bid);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return aid.localeCompare(bid);
  });
  
  sorted.forEach(node => {
     if (['npc_dialogue', 'player_response'].includes(node.data.type)) {
       map[node.id] = currentId++;
     }
  });
  
  return { map, sorted };
}

export function generateMSG(nodes: DialogueNode[]): string {
  let msgContent = `// Auto-generated Fallout 2 MSG File\n// Standard encoding applies\n\n`;
  const { map, sorted } = getMsgIdMap(nodes);
  
  sorted.forEach(node => {
    if (['npc_dialogue', 'player_response'].includes(node.data.type)) {
      const msgId = map[node.id];
      const sanitizedText = (node.data.text || '').replace(/\n/g, ' ');
      msgContent += `{${msgId}}{}{${sanitizedText}}\n`;
    }
  });

  return msgContent;
}

export function generateSSL(projectName: string, nodes: DialogueNode[], edges: Edge[]): string {
  let sslContent = `// Auto-generated Fallout 2 SSL Script File\n// Project: ${projectName}\n\n`;
  sslContent += `#include "define.h"\n#include "command.h"\n\n`;

  const { map } = getMsgIdMap(nodes);

  nodes.forEach(node => {
    if (node.data.type === 'npc_dialogue') {
      const msgId = map[node.id];
      const procName = `Node${msgId}`;
      sslContent += `procedure ${procName} begin\n`;
      sslContent += `    Reply(${msgId});\n`;

      const outgoingEdges = edges.filter(e => e.source === node.id);
      outgoingEdges.forEach(edge => {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode && targetNode.data.type === 'player_response') {
           const responseMsgId = map[targetNode.id];
           
           // find where this player response goes
           const responseOutgoingEdges = edges.filter(e => e.source === targetNode.id);
           const nextNpcNode = nodes.find(n => n.id === responseOutgoingEdges[0]?.target);
           
           let nextProcName = 'Node999';
           if (nextNpcNode && nextNpcNode.data.type === 'npc_dialogue') {
               nextProcName = `Node${map[nextNpcNode.id]}`;
           }

           sslContent += `    giq_option(4, NAME, ${responseMsgId}, ${nextProcName}, NEUTRAL_REACTION);\n`;
        }
      });

      sslContent += `end\n\n`;
    }
  });

  sslContent += `procedure Node999 begin\n    // dummy exit node\nend\n\n`;

  return sslContent;
}
