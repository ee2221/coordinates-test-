import React, { useState } from 'react';
import { Camera, RotateCcw } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

const CameraPerspectivePanel: React.FC = () => {
  const { cameraPerspective, setCameraPerspective } = useSceneStore();
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);

  const perspectives = {
    'front': { name: 'Front', shortcut: 'Num 1', color: '#3b82f6' },
    'right': { name: 'Side', shortcut: 'Num 3', color: '#10b981' },
    'top': { name: 'Top', shortcut: 'Num 7', color: '#8b5cf6' },
  };

  const getCurrentPerspectiveInfo = () => {
    if (cameraPerspective === 'perspective') {
      return { name: 'Perspective', shortcut: 'Num 0', color: '#6b7280' };
    }
    // Map other views to the three main ones
    if (cameraPerspective === 'left') {
      return { name: 'Side', shortcut: 'Num 3', color: '#10b981' };
    }
    if (cameraPerspective === 'back') {
      return { name: 'Front', shortcut: 'Num 1', color: '#3b82f6' };
    }
    if (cameraPerspective === 'bottom') {
      return { name: 'Top', shortcut: 'Num 7', color: '#8b5cf6' };
    }
    return perspectives[cameraPerspective] || { name: 'Unknown', shortcut: '', color: '#6b7280' };
  };

  const currentInfo = getCurrentPerspectiveInfo();

  const handleFaceClick = (face: string) => {
    if (face === 'front') {
      // Toggle between front and back
      setCameraPerspective(cameraPerspective === 'front' ? 'back' : 'front');
    } else if (face === 'right') {
      // Toggle between right and left
      setCameraPerspective(cameraPerspective === 'right' ? 'left' : 'right');
    } else if (face === 'top') {
      // Toggle between top and bottom
      setCameraPerspective(cameraPerspective === 'top' ? 'bottom' : 'top');
    }
  };

  return (
    <div className="absolute left-4 bottom-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-4 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white/90">Camera</h2>
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-white/70">{currentInfo.name}</span>
        </div>
      </div>

      {/* Interactive Cube */}
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full cursor-pointer"
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
        >
          {/* Cube faces */}
          {/* Front face */}
          <polygon
            points="50,60 150,60 150,140 50,140"
            fill={
              (cameraPerspective === 'front' || cameraPerspective === 'back') 
                ? perspectives.front.color 
                : (hoveredFace === 'front' ? '#374151' : '#2a2a2a')
            }
            stroke="#4a5568"
            strokeWidth="1"
            className="transition-all duration-200 hover:brightness-110"
            onClick={() => handleFaceClick('front')}
            onMouseEnter={() => setHoveredFace('front')}
            onMouseLeave={() => setHoveredFace(null)}
          />
          
          {/* Right face (Side) */}
          <polygon
            points="150,60 180,40 180,120 150,140"
            fill={
              (cameraPerspective === 'right' || cameraPerspective === 'left') 
                ? perspectives.right.color 
                : (hoveredFace === 'right' ? '#374151' : '#1f1f1f')
            }
            stroke="#4a5568"
            strokeWidth="1"
            className="transition-all duration-200 hover:brightness-110"
            onClick={() => handleFaceClick('right')}
            onMouseEnter={() => setHoveredFace('right')}
            onMouseLeave={() => setHoveredFace(null)}
          />
          
          {/* Top face */}
          <polygon
            points="50,60 80,40 180,40 150,60"
            fill={
              (cameraPerspective === 'top' || cameraPerspective === 'bottom') 
                ? perspectives.top.color 
                : (hoveredFace === 'top' ? '#374151' : '#333333')
            }
            stroke="#4a5568"
            strokeWidth="1"
            className="transition-all duration-200 hover:brightness-110"
            onClick={() => handleFaceClick('top')}
            onMouseEnter={() => setHoveredFace('top')}
            onMouseLeave={() => setHoveredFace(null)}
          />

          {/* Face labels */}
          <text x="100" y="105" textAnchor="middle" className="fill-white/70 text-xs font-medium pointer-events-none">
            F
          </text>
          <text x="165" y="95" textAnchor="middle" className="fill-white/70 text-xs font-medium pointer-events-none">
            S
          </text>
          <text x="115" y="55" textAnchor="middle" className="fill-white/70 text-xs font-medium pointer-events-none">
            T
          </text>
        </svg>

        {/* Perspective mode button */}
        <button
          onClick={() => setCameraPerspective('perspective')}
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 p-2 rounded-full transition-all duration-200 ${
            cameraPerspective === 'perspective'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
          }`}
          title="Perspective View (Num 0)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Current view info */}
      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: currentInfo.color }}
            ></div>
            <span className="text-sm font-medium text-white/90">{currentInfo.name}</span>
          </div>
          <span className="text-xs text-white/50 font-mono">{currentInfo.shortcut}</span>
        </div>
        <div className="text-xs text-white/70">
          {cameraPerspective === 'perspective' 
            ? 'Free rotation enabled' 
            : 'Click face again to flip view'
          }
        </div>
      </div>
    </div>
  );
};

export default CameraPerspectivePanel;