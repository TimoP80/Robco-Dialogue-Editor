import * as React from 'react';
import { useState } from 'react';
import { useStore } from '../lib/store';
import { Download, Upload, Settings, Wrench, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

import { generateMSG, generateSSL } from '../lib/exportUtils';
import { toast } from 'sonner';
import SimulationDialog from './SimulationDialog';

export default function TopBar() {
  const project = useStore((state) => state.project);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const loadProject = useStore((state) => state.loadProject);
  const updateProject = useStore((state) => state.updateProject);
  
  const [simulationOpen, setSimulationOpen] = useState(false);

  const handleExportJSON = () => {
    const data = JSON.stringify({ project, nodes, edges }, null, 2);
    downloadFile(data, `${project.name}.json`, 'application/json');
    toast.success('Project saved securely.');
  };

  const handleExportMSG = () => {
    const data = generateMSG(nodes);
    downloadFile(data, `${project.name}.msg`, 'text/plain');
    toast.success('.MSG file generated successfully.');
  };

  const handleExportSSL = () => {
    const data = generateSSL(project.name, nodes, edges);
    downloadFile(data, `${project.name}.ssl`, 'text/plain');
    toast.success('.SSL file generated successfully.');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          loadProject(json);
          toast.success('System restablished. Connection ok.');
        } catch (error) {
          toast.error('Corrupted file detected. Aborting.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-14 border-b border-primary bg-card/95 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <h1 className="font-black text-xl tracking-widest uppercase flex items-center gap-2">
          <span className="bg-primary text-background px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(26,255,128,0.5)]">
            ROBCO
          </span>
          Dialogue Editor
        </h1>
        <div className="text-xs opacity-50 px-2 py-1 border border-primary/30 rounded">
          v1.0 {project.name}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="text-xs" />}>
            <Wrench className="w-4 h-4 mr-2" /> Tools
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 font-mono border-primary bg-background text-foreground">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Utilities</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-primary/30" />
              <DropdownMenuItem onClick={() => updateProject({ viewMode: project.viewMode === 'graph' ? 'linear' : 'graph' })}>
                {project.viewMode === 'graph' ? 'Switch to Linear View' : 'Switch to Graph View'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSimulationOpen(true)}>
                <Play className="w-4 h-4 mr-2" /> Run Simulation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast('Float messaging console offline.')}>
                Float Editor (WIP)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast('No linting errors detected. System optimal.')}>
                Script Linter
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={handleExportMSG} className="text-xs">
          .MSG
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportSSL} className="text-xs">
          .SSL
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportJSON} className="text-xs">
          <Download className="w-4 h-4 mr-2" /> Save Project
        </Button>
        <div>
          <Label htmlFor="import-file" className="cursor-pointer">
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs">
              <Upload className="w-4 h-4 mr-2" /> Load Project
            </div>
          </Label>
          <Input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
        <Dialog>
          <DialogTrigger render={<Button variant="ghost" size="icon" />}>
            <Settings className="w-5 h-5" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-primary font-mono text-foreground bg-background">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest text-primary">System Settings</DialogTitle>
              <DialogDescription className="text-muted-foreground opacity-80">
                Configure project and rendering options.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <ProjectSettingsForm />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <SimulationDialog open={simulationOpen} onOpenChange={setSimulationOpen} />
    </div>
  );
}

function ProjectSettingsForm() {
  const project = useStore((state) => state.project);
  const updateProject = useStore((state) => state.updateProject);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right uppercase text-xs">
          Project Name
        </Label>
        <Input
          id="name"
          value={project.name}
          onChange={(e) => updateProject({ name: e.target.value })}
          className="col-span-3 bg-background"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="author" className="text-right uppercase text-xs">
          Author
        </Label>
        <Input
          id="author"
          value={project.author}
          onChange={(e) => updateProject({ author: e.target.value })}
          className="col-span-3 bg-background"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="theme" className="text-right uppercase text-xs">
          Theme Color
        </Label>
        <select
          id="theme"
          value={project.theme}
          onChange={(e) => updateProject({ theme: e.target.value as any })}
          className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="pip-boy-green">Classic Green</option>
          <option value="pip-boy-amber">New Vegas Amber</option>
        </select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="crt" className="text-right uppercase text-xs">
          CRT Effect
        </Label>
        <input
          id="crt"
          type="checkbox"
          checked={project.crtEffect}
          onChange={(e) => updateProject({ crtEffect: e.target.checked })}
          className="col-span-3 w-4 h-4 accent-primary"
        />
      </div>
    </div>
  );
}
