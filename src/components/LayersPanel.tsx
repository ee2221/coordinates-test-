import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit2, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen,
  Plus,
  Users,
  FolderPlus
} from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

const LayersPanel: React.FC = () => {
  const { 
    objects, 
    groups,
    removeObject, 
    toggleVisibility, 
    updateObjectName,
    createGroup,
    removeGroup,
    toggleGroupExpanded,
    toggleGroupVisibility,
    updateGroupName,
    moveObjectsToGroup,
    removeObjectFromGroup
  } = useSceneStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState<'object' | 'group'>('object');
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [showGroupOptions, setShowGroupOptions] = useState(false);

  const startEditing = (id: string, name: string, type: 'object' | 'group') => {
    setEditingId(id);
    setEditingName(name);
    setEditingType(type);
  };

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      if (editingType === 'object') {
        updateObjectName(editingId, editingName.trim());
      } else {
        updateGroupName(editingId, editingName.trim());
      }
    }
    setEditingId(null);
  };

  const handleObjectSelect = (objectId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      setSelectedObjects(prev => 
        prev.includes(objectId) 
          ? prev.filter(id => id !== objectId)
          : [...prev, objectId]
      );
    } else {
      // Single select
      setSelectedObjects([objectId]);
    }
  };

  const createGroupFromSelected = () => {
    if (selectedObjects.length > 0) {
      createGroup(`Group ${groups.length + 1}`, selectedObjects);
      setSelectedObjects([]);
      setShowGroupOptions(false);
    }
  };

  const moveSelectedToGroup = (groupId: string | null) => {
    if (selectedObjects.length > 0) {
      moveObjectsToGroup(selectedObjects, groupId);
      setSelectedObjects([]);
      setShowGroupOptions(false);
    }
  };

  // Get ungrouped objects
  const ungroupedObjects = objects.filter(obj => !obj.groupId);

  return (
    <div className="absolute right-4 top-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-4 w-80 border border-white/5 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white/90">Layers</h2>
        <div className="flex gap-2">
          {selectedObjects.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowGroupOptions(!showGroupOptions)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
                title="Group Options"
              >
                <Users className="w-4 h-4" />
              </button>
              {showGroupOptions && (
                <div className="absolute right-0 top-8 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-lg z-10 min-w-48">
                  <button
                    onClick={createGroupFromSelected}
                    className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Create New Group
                  </button>
                  {groups.length > 0 && (
                    <>
                      <div className="border-t border-white/10 my-1"></div>
                      <div className="px-3 py-1 text-xs text-white/50 uppercase tracking-wider">
                        Move to Group
                      </div>
                      {groups.map(group => (
                        <button
                          key={group.id}
                          onClick={() => moveSelectedToGroup(group.id)}
                          className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                        >
                          <Folder className="w-4 h-4" />
                          {group.name}
                        </button>
                      ))}
                      <button
                        onClick={() => moveSelectedToGroup(null)}
                        className="w-full px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5 flex items-center gap-2"
                      >
                        <div className="w-4 h-4" />
                        Ungroup
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => createGroup(`Group ${groups.length + 1}`)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
            title="Create Empty Group"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {/* Render Groups */}
        {groups.map((group) => (
          <div key={group.id} className="space-y-1">
            <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors text-white/90">
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => toggleGroupExpanded(group.id)}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                >
                  {group.expanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {group.expanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-400" />
                )}

                {editingId === group.id && editingType === 'group' ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    className="bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 flex-1 text-sm focus:outline-none focus:border-blue-500/50"
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium">{group.name}</span>
                )}
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => editingId !== group.id && startEditing(group.id, group.name, 'group')}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Rename Group"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleGroupVisibility(group.id)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title={group.visible ? 'Hide Group' : 'Show Group'}
                >
                  {group.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => removeGroup(group.id)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                  title="Delete Group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Group Objects */}
            {group.expanded && (
              <div className="ml-6 space-y-1">
                {objects
                  .filter(obj => obj.groupId === group.id)
                  .map(({ id, name, visible }) => (
                    <div 
                      key={id} 
                      className={`flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors text-white/90 cursor-pointer ${
                        selectedObjects.includes(id) ? 'bg-blue-500/20 border border-blue-500/30' : ''
                      }`}
                      onClick={(e) => handleObjectSelect(id, e)}
                    >
                      {editingId === id && editingType === 'object' ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          className="bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 w-32 text-sm focus:outline-none focus:border-blue-500/50"
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1 text-sm">{name}</span>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editingId !== id && startEditing(id, name, 'object');
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVisibility(id);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          title={visible ? 'Hide' : 'Show'}
                        >
                          {visible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeObjectFromGroup(id);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-orange-400 hover:text-orange-300"
                          title="Remove from Group"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeObject(id);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}

        {/* Ungrouped Objects */}
        {ungroupedObjects.map(({ id, name, visible }) => (
          <div 
            key={id} 
            className={`flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors text-white/90 cursor-pointer ${
              selectedObjects.includes(id) ? 'bg-blue-500/20 border border-blue-500/30' : ''
            }`}
            onClick={(e) => handleObjectSelect(id, e)}
          >
            {editingId === id && editingType === 'object' ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                className="bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 w-32 text-sm focus:outline-none focus:border-blue-500/50"
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm">{name}</span>
            )}
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  editingId !== id && startEditing(id, name, 'object');
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Rename"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVisibility(id);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title={visible ? 'Hide' : 'Show'}
              >
                {visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeObject(id);
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {objects.length === 0 && (
          <div className="text-center py-8 text-white/50">
            <p className="text-sm">No objects in scene</p>
            <p className="text-xs mt-1">Add objects using the toolbar</p>
          </div>
        )}
      </div>

      {selectedObjects.length > 0 && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-400">
            {selectedObjects.length} object{selectedObjects.length > 1 ? 's' : ''} selected
          </p>
          <p className="text-xs text-white/50 mt-1">
            Use Ctrl/Cmd + click to select multiple objects
          </p>
        </div>
      )}
    </div>
  );
};

export default LayersPanel;