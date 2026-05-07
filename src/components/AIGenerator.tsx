import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStore, DialogueNode } from '../lib/store';
import { GoogleGenAI, Type } from '@google/genai';
import { Bot, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Edge, useReactFlow } from '@xyflow/react';
import { toast } from 'sonner';
import dagre from 'dagre';

export default function AIGenerator() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [speaker, setSpeaker] = useState('');

  const addNodesAndEdges = useStore((state) => state.addNodesAndEdges);
  const nodes = useStore((state) => state.nodes);
  const reactFlow = useReactFlow();

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error('Please provide a prompt for the AI to process.');
      return;
    }
    
    setLoading(true);

    try {
      if (!process.env.GEMINI_API_KEY) {
         toast.error('API Key missing. System offline.');
         setLoading(false);
         return;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Create a complete Fallout-style branching dialogue tree (10-20 nodes).
          Speaker: ${speaker || "Unknown NPC"}. 
          Scenario: ${prompt}.
          
          CRITICAL INSTRUCTIONS:
          - Generate EXACTLY 10 to 20 nodes. DO NOT stop prematurely.
          - Ensure choices form a deeply branching conversation.
          - npc_dialogue MUST link to player_responses.
          - player_responses MUST link to other npc_dialogues.
          - Provide multiple player_responses for NPC questions to create real choices.
          - EVERY node (except the absolute final closing ones at the very bottom of the tree) MUST have a populated 'linksTo' array pointing to existing customIds.
          - 'linksTo' MUST easily map back and forth. No dead ends until the natural conclusion.
          - 'linksTo' MUST be an array of strings pointing to child 'customId's.
          - Use customIds like "1", "2", "3", etc.
          - Example structure:
            Node "1" (npc) linksTo ["2", "3"]
            Node "2" (player) linksTo ["4"]
            Node "3" (player) linksTo ["5"]
          - Make the dialogue gritty, mature, dark, and retro-futuristic.`,
        config: {
          systemInstruction: "You are an expert RPG writer for Fallout 2. Write gritty, mature, dark retro-futuristic dialogue. Ensure clear dialogue flow linking from NPC -> Player -> NPC.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                description: "List of dialogue nodes",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: "Must be 'npc_dialogue' or 'player_response'",
                    },
                    text: {
                      type: Type.STRING,
                      description: "The dialogue text or player choice text",
                    },
                    customId: {
                      type: Type.STRING,
                      description: "A unique numeric ID (e.g. '200', '201'). Must be unique across all nodes.",
                    },
                    speaker: {
                      type: Type.STRING,
                      description: "Speaker name (only for npc_dialogue)"
                    },
                    linksTo: {
                      type: Type.ARRAY,
                      description: "Array of child customIds that this node flows into.",
                      items: {
                        type: Type.STRING
                      }
                    }
                  },
                  required: ["type", "text", "customId"]
                }
              }
            },
            required: ["items"]
          }
        }
      });

      let jsonStr = response.text || '';
      
      // Look for JSON block in markdown
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1];
      }
      
      jsonStr = jsonStr.trim();
      
      let data;
      try {
        data = JSON.parse(jsonStr);
      } catch (e: any) {
        console.error('JSON parsing failed:', e, jsonStr);
        toast.error('AI responded with invalid format. Please try again.');
        setLoading(false);
        return;
      }

      if (data && data.items && Array.isArray(data.items)) {
        const newNodes: DialogueNode[] = [];
        const newEdges: Edge[] = [];
        
        let xOffset = 200;
        let yOffset = 200;

        if (nodes.length > 0) {
            const lastNode = nodes[nodes.length - 1];
            xOffset = Math.max(200, lastNode.position.x + 300);
            yOffset = lastNode.position.y;
        }

        const idMap: Record<string, string> = {};
        
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));
        dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 200 });

        data.items.forEach((item: any, idx: number) => {
          const cid = String(item.customId || `gen_${idx}`);
          item.customId = cid; // ensure it is set for later
          const internalId = uuidv4();
          idMap[cid] = internalId;
          dagreGraph.setNode(cid, { width: 300, height: 200 });
        });

        data.items.forEach((item: any) => {
          if (item.linksTo && Array.isArray(item.linksTo)) {
            item.linksTo.forEach((targetCustomId: string | number) => {
               const tid = String(targetCustomId);
               if (idMap[tid]) {
                 dagreGraph.setEdge(String(item.customId), tid);
               }
            });
          }
        });

        dagre.layout(dagreGraph);

        data.items.forEach((item: any, index: number) => {
          const internalId = idMap[String(item.customId)];
          const nodeWithPosition = dagreGraph.node(String(item.customId));
          
          if (!internalId) return;
          
          // Dagre x and y are the center of the node, shift by half width/height
          const px = nodeWithPosition ? nodeWithPosition.x - 150 : (index % 3) * 300;
          const py = nodeWithPosition ? nodeWithPosition.y - 100 : Math.floor(index / 3) * 150;

          newNodes.push({
            id: internalId,
            type: 'customNode',
            position: { x: xOffset + px, y: yOffset + py },
            className: 'fallout-node-container',
            data: {
              type: item.type === 'npc_dialogue' || item.type === 'player_response' ? item.type : 'npc_dialogue',
              speaker: item.speaker || speaker,
              text: item.text,
              customId: String(item.customId),
              label: item.type
            }
          });
        });

        data.items.forEach((item: any) => {
          if (item.linksTo && Array.isArray(item.linksTo)) {
            item.linksTo.forEach((targetCustomId: string | number) => {
               const targetId = idMap[String(targetCustomId)];
               const sourceId = idMap[String(item.customId)];
               if (sourceId && targetId) {
                 newEdges.push({
                   id: uuidv4(),
                   source: sourceId,
                   target: targetId,
                 });
               }
            });
          }
        });

        addNodesAndEdges(newNodes, newEdges);
        toast.success('AI Dialogue generated and injected to canvas.');
        setOpen(false);
        
        // Wait longer to ensure React Flow has completely flushed DOM changes and processed the new nodes.
        setTimeout(() => {
           const { viewMode } = useStore.getState().project;
           if (viewMode === 'graph') {
             reactFlow.fitView({ padding: 0.2, duration: 800, maxZoom: 1 });
           }
        }, 300);

      } else {
        toast.error('AI returned invalid blueprint structure.');
      }

    } catch (e: any) {
      console.error(e);
      toast.error(`AI generation failed: ${e.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="w-full justify-start h-auto py-3 bg-secondary hover:bg-secondary/80 border-primary/30 mt-4 text-accent" />}>
        <Bot className="w-5 h-5 mr-3" />
        <div className="text-left font-mono tracking-wider">
          <div className="text-[11px] uppercase font-bold text-accent">AI Auto-Generate</div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-primary font-mono bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest text-primary flex items-center gap-2">
            <Bot className="w-5 h-5"/> GECK AI Assistant
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs opacity-70">
            Generate branches using Vault-Tec proprietary algorithms.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="speaker" className="text-xs uppercase opacity-70">NPC Speaker Name</Label>
            <Input
              id="speaker"
              placeholder="e.g. Marcus, Myron, Overseer"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              className="bg-background border-primary/50 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-xs uppercase opacity-70">Scenario / Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Player asks for a water chip..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-background border-primary/50 text-sm h-[100px]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="text-xs">
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading} className="bg-primary text-background hover:bg-primary/80 text-xs">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Generate Branch'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
