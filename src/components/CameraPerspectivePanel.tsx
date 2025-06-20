import React from 'react';
import { 
  Camera, 
  Eye, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

const CameraPerspectivePanel: React.FC = () => {
  const { cameraPerspective, setCameraPerspective } = useSceneStore();

  const perspectives = [
    {
      id: 'perspective',
      name: 'Perspective',
      icon: Camera,
      shortcut: 'Num 0',
      description: 'Free perspective view'
    },
    {
      id: 'front',
      name: 'Front',
      icon: Eye,
      shortcut: 'Num 1',
      description: 'Front orthographic view'
    },
    {
      id: 'back',
      name: 'Back',
      icon: RotateCw,
      shortcut: 'Ctrl+Num 1',
      description: 'Back orthographic view'
    },
    {
      id: 'right',
      name: 'Right',
      icon: ArrowRight,
      shortcut: 'Num 3',
      description: 'Right side orthographic view'
    },
    {
      id: 'left',
      name: 'Left',
      icon: ArrowLeft,
      shortcut: 'Ctrl+Num 3',
      description: 'Left side orthographic view'
    },
    {
      id: 'top',
      name: 'Top',
      icon: ArrowUp,
      shortcut: 'Num 7',
      description: 'Top orthographic view'
    },
    {
      id: 'bottom',
      name: 'Bottom',
      icon: ArrowDown,
      shortcut: 'Ctrl+Num 7',
      description: 'Bottom orthographic view'
    }
  ] as const;

  return (
    <div className="absolute left-4 bottom-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-4 border border-white/5 min-w-64">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white/90">Camera Views</h2>
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-white/70 capitalize">{cameraPerspective}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {perspectives.map(({ id, name, icon: Icon, shortcut, description }) => (
          <button
            key={id}
            onClick={() => setCameraPerspective(id as any)}
            className={`p-3 rounded-lg transition-all duration-200 border text-left group ${
              cameraPerspective === id
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                : 'bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20'
            }`}
            title={description}
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon className={`w-5 h-5 ${
                cameraPerspective === id ? 'text-blue-400' : 'text-white/70'
              }`} />
              <span className="font-medium text-sm">{name}</span>
            </div>
            <div className={`text-xs ${
              cameraPerspective === id ? 'text-blue-300/70' : 'text-white/50'
            }`}>
              {shortcut}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="text-sm font-medium text-white/90">Quick Tips</span>
        </div>
        <div className="space-y-1 text-xs text-white/70">
          <p>• Use numpad keys for quick switching</p>
          <p>• Hold Ctrl for opposite views</p>
          <p>• Orthographic views disable perspective</p>
          <p>• Perfect for technical modeling</p>
        </div>
      </div>
    </div>
  );
};

export default CameraPerspectivePanel;