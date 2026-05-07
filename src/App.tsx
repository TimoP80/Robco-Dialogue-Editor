import { useCallback, useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  ReactFlowProvider,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Toaster } from "@/components/ui/sonner"

import CustomNode from './components/CustomNode';
import Sidebar from './components/Sidebar';
import PropertiesPanel from './components/PropertiesPanel';
import TopBar from './components/TopBar';
import LinearDialogueView from './components/LinearDialogueView';
import { useStore } from './lib/store';

const nodeTypes = {
  customNode: CustomNode,
};

export default function App() {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);
  const setSelectedNode = useStore((state) => state.setSelectedNode);
  const project = useStore((state) => state.project);

  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onInit = useCallback((instance: any) => {
    console.log('Flow initialized');
    setReactFlowInstance(instance);
  }, []);

  const handleSelectionChange = useCallback((params: any) => {
    if (params.nodes && params.nodes.length > 0) {
      setSelectedNode(params.nodes[0].id);
    } else {
      setSelectedNode(null);
    }
  }, [setSelectedNode]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow') as any;
    if (type && reactFlowInstance) {
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      useStore.getState().addNode(type, position);
    }
  }, [reactFlowInstance]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  useEffect(() => {
    document.body.className = project.theme === 'pip-boy-amber' ? 'amber-theme dark' : 'dark';
    if (project.crtEffect) {
      // Create crt layer
      const div = document.createElement('div');
      div.id = 'crt-overlay';
      div.className = 'crt-effect pointer-events-none fixed inset-0 z-[100]';
      document.body.appendChild(div);
      return () => {
        const el = document.getElementById('crt-overlay');
        if (el) el.remove();
      };
    }
  }, [project.theme, project.crtEffect]);

  return (
    <div className={`h-full w-full flex flex-col font-mono text-foreground bg-transparent overflow-hidden ${project.theme === 'pip-boy-amber' ? 'amber-theme' : ''}`} style={{ border: '20px solid #1a1a1a', boxSizing: 'border-box' }}>
      <ReactFlowProvider>
        <TopBar />
        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar />
          
          {project.viewMode === 'linear' ? (
            <LinearDialogueView />
          ) : (
            <div className="flex-1 h-full relative" style={{ backgroundImage: 'radial-gradient(var(--secondary) 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: 'var(--background)' }}>
                 <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onInit={onInit}
                  onSelectionChange={handleSelectionChange}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  nodeTypes={nodeTypes}
                  fitView
                  className="fallout-flow"
                  defaultEdgeOptions={{ 
                    style: { stroke: 'var(--primary)', strokeWidth: 2 },
                    animated: true
                  }}
                >
                  <Background gap={20} size={1} variant={BackgroundVariant.Lines} color="var(--primary)" className="opacity-10" />
                  <Controls className="bg-background border-primary fill-primary [&>button]:border-primary/50 [&>button]:bg-secondary [&>button]:hover:bg-primary/20" />
                  <MiniMap 
                    nodeStrokeColor="var(--primary)" 
                    nodeColor="var(--secondary)" 
                    maskColor="rgba(0,0,0,0.8)"
                    className="bg-background border-2 border-primary"
                  />
                </ReactFlow>
            </div>
          )}

          <PropertiesPanel />
        </div>
      </ReactFlowProvider>
      <Toaster theme="dark" toastOptions={{
        className: 'bg-background border-primary text-primary font-mono uppercase rounded-none',
      }} />
    </div>
  );
}
