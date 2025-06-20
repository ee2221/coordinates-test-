import { create } from 'zustand';
import * as THREE from 'three';

type EditMode = 'vertex' | 'edge' | null;

interface Group {
  id: string;
  name: string;
  expanded: boolean;
  visible: boolean;
  objectIds: string[];
}

interface SceneState {
  objects: Array<{
    id: string;
    object: THREE.Object3D;
    name: string;
    visible: boolean;
    groupId?: string;
  }>;
  groups: Group[];
  selectedObject: THREE.Object3D | null;
  transformMode: 'translate' | 'rotate' | 'scale' | null;
  editMode: EditMode;
  selectedElements: {
    vertices: number[];
    edges: number[];
    faces: number[];
  };
  draggedVertex: {
    indices: number[];
    position: THREE.Vector3;
    initialPosition: THREE.Vector3;
  } | null;
  draggedEdge: {
    indices: number[][];
    positions: THREE.Vector3[];
    initialPositions: THREE.Vector3[];
    connectedVertices: Set<number>;
    midpoint: THREE.Vector3;
  } | null;
  isDraggingEdge: boolean;
  addObject: (object: THREE.Object3D, name: string) => void;
  removeObject: (id: string) => void;
  setSelectedObject: (object: THREE.Object3D | null) => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale' | null) => void;
  setEditMode: (mode: EditMode) => void;
  toggleVisibility: (id: string) => void;
  updateObjectName: (id: string, name: string) => void;
  updateObjectProperties: () => void;
  updateObjectColor: (color: string) => void;
  updateObjectOpacity: (opacity: number) => void;
  setSelectedElements: (type: 'vertices' | 'edges' | 'faces', indices: number[]) => void;
  startVertexDrag: (index: number, position: THREE.Vector3) => void;
  updateVertexDrag: (position: THREE.Vector3) => void;
  endVertexDrag: () => void;
  startEdgeDrag: (vertexIndices: number[], positions: THREE.Vector3[], midpoint: THREE.Vector3) => void;
  updateEdgeDrag: (position: THREE.Vector3) => void;
  endEdgeDrag: () => void;
  setIsDraggingEdge: (isDragging: boolean) => void;
  updateCylinderVertices: (vertexCount: number) => void;
  updateSphereVertices: (vertexCount: number) => void;
  // Group management
  createGroup: (name: string, objectIds?: string[]) => void;
  removeGroup: (groupId: string) => void;
  addObjectToGroup: (objectId: string, groupId: string) => void;
  removeObjectFromGroup: (objectId: string) => void;
  toggleGroupExpanded: (groupId: string) => void;
  toggleGroupVisibility: (groupId: string) => void;
  updateGroupName: (groupId: string, name: string) => void;
  moveObjectsToGroup: (objectIds: string[], groupId: string | null) => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
  groups: [],
  selectedObject: null,
  transformMode: null,
  editMode: null,
  selectedElements: {
    vertices: [],
    edges: [],
    faces: [],
  },
  draggedVertex: null,
  draggedEdge: null,
  isDraggingEdge: false,

  addObject: (object, name) =>
    set((state) => ({
      objects: [...state.objects, { id: crypto.randomUUID(), object, name, visible: true }],
    })),

  removeObject: (id) =>
    set((state) => {
      // Remove object from any group
      const updatedGroups = state.groups.map(group => ({
        ...group,
        objectIds: group.objectIds.filter(objId => objId !== id)
      }));

      return {
        objects: state.objects.filter((obj) => obj.id !== id),
        groups: updatedGroups,
        selectedObject: state.objects.find((obj) => obj.id === id)?.object === state.selectedObject
          ? null
          : state.selectedObject,
      };
    }),

  setSelectedObject: (object) => 
    set((state) => {
      // Auto-enable vertex mode for sphere, cylinder, and cone
      let newEditMode = state.editMode;
      if (object instanceof THREE.Mesh) {
        const geometry = object.geometry;
        if (geometry instanceof THREE.SphereGeometry ||
            geometry instanceof THREE.CylinderGeometry ||
            geometry instanceof THREE.ConeGeometry) {
          newEditMode = 'vertex';
        }
      }
      
      return { 
        selectedObject: object,
        editMode: newEditMode,
        transformMode: null // Clear transform mode when selecting object
      };
    }),

  setTransformMode: (mode) => set({ transformMode: mode }),
  
  setEditMode: (mode) => 
    set((state) => {
      // If trying to set edge mode on unsupported geometry, prevent it
      if (mode === 'edge' && state.selectedObject instanceof THREE.Mesh) {
        const geometry = state.selectedObject.geometry;
        if (geometry instanceof THREE.CylinderGeometry ||
            geometry instanceof THREE.ConeGeometry ||
            geometry instanceof THREE.SphereGeometry) {
          return state; // Don't change the edit mode
        }
      }
      return { editMode: mode };
    }),

  toggleVisibility: (id) =>
    set((state) => {
      const updatedObjects = state.objects.map((obj) =>
        obj.id === id ? { ...obj, visible: !obj.visible } : obj
      );
      
      const toggledObject = updatedObjects.find((obj) => obj.id === id);
      
      const newSelectedObject = (toggledObject && !toggledObject.visible && toggledObject.object === state.selectedObject)
        ? null
        : state.selectedObject;

      return {
        objects: updatedObjects,
        selectedObject: newSelectedObject,
      };
    }),

  updateObjectName: (id, name) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, name } : obj
      ),
    })),

  updateObjectProperties: () => set((state) => ({ ...state })),

  updateObjectColor: (color) => 
    set((state) => {
      if (state.selectedObject instanceof THREE.Mesh) {
        const material = state.selectedObject.material as THREE.MeshStandardMaterial;
        material.color.setStyle(color);
        material.needsUpdate = true;
      }
      return state;
    }),

  updateObjectOpacity: (opacity) =>
    set((state) => {
      if (state.selectedObject instanceof THREE.Mesh) {
        const material = state.selectedObject.material as THREE.MeshStandardMaterial;
        material.transparent = opacity < 1;
        material.opacity = opacity;
        material.needsUpdate = true;
      }
      return state;
    }),

  setSelectedElements: (type, indices) =>
    set((state) => ({
      selectedElements: {
        ...state.selectedElements,
        [type]: indices,
      },
    })),

  startVertexDrag: (index, position) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh)) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const overlappingIndices = [];
      const selectedPos = new THREE.Vector3(
        positions.getX(index),
        positions.getY(index),
        positions.getZ(index)
      );

      for (let i = 0; i < positions.count; i++) {
        const pos = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        if (pos.distanceTo(selectedPos) < 0.0001) {
          overlappingIndices.push(i);
        }
      }

      return {
        draggedVertex: {
          indices: overlappingIndices,
          position: position.clone(),
          initialPosition: position.clone()
        },
        selectedElements: {
          ...state.selectedElements,
          vertices: overlappingIndices
        }
      };
    }),

  updateVertexDrag: (position) =>
    set((state) => {
      if (!state.draggedVertex || !(state.selectedObject instanceof THREE.Mesh)) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      
      // Update all overlapping vertices to the new position
      state.draggedVertex.indices.forEach(index => {
        positions.setXYZ(
          index,
          position.x,
          position.y,
          position.z
        );
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      return {
        draggedVertex: {
          ...state.draggedVertex,
          position: position.clone()
        }
      };
    }),

  endVertexDrag: () => set({ draggedVertex: null }),

  startEdgeDrag: (vertexIndices, positions, midpoint) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh)) return state;

      const geometry = state.selectedObject.geometry;
      const positionAttribute = geometry.attributes.position;
      const connectedVertices = new Set<number>();
      const edges: number[][] = [];

      // Find all overlapping vertices for each vertex in the edge
      const findOverlappingVertices = (targetIndex: number) => {
        const targetPos = new THREE.Vector3(
          positionAttribute.getX(targetIndex),
          positionAttribute.getY(targetIndex),
          positionAttribute.getZ(targetIndex)
        );

        const overlapping = [targetIndex];
        for (let i = 0; i < positionAttribute.count; i++) {
          if (i === targetIndex) continue;

          const pos = new THREE.Vector3(
            positionAttribute.getX(i),
            positionAttribute.getY(i),
            positionAttribute.getZ(i)
          );

          if (pos.distanceTo(targetPos) < 0.0001) {
            overlapping.push(i);
          }
        }
        return overlapping;
      };

      // Get all overlapping vertices for both edge vertices
      const vertex1Overlapping = findOverlappingVertices(vertexIndices[0]);
      const vertex2Overlapping = findOverlappingVertices(vertexIndices[1]);

      // Add all overlapping vertices to connected set
      vertex1Overlapping.forEach(v => connectedVertices.add(v));
      vertex2Overlapping.forEach(v => connectedVertices.add(v));

      // Create edge pairs
      vertex1Overlapping.forEach(v1 => {
        vertex2Overlapping.forEach(v2 => {
          edges.push([v1, v2]);
        });
      });

      return {
        draggedEdge: {
          indices: edges,
          positions: positions,
          initialPositions: positions.map(p => p.clone()),
          connectedVertices,
          midpoint: midpoint.clone()
        },
        selectedElements: {
          ...state.selectedElements,
          edges: Array.from(connectedVertices)
        }
      };
    }),

  updateEdgeDrag: (position) =>
    set((state) => {
      if (!state.draggedEdge || !(state.selectedObject instanceof THREE.Mesh)) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const offset = position.clone().sub(state.draggedEdge.midpoint);

      // Move all connected vertices by the offset
      state.draggedEdge.connectedVertices.forEach(vertexIndex => {
        const currentPos = new THREE.Vector3(
          positions.getX(vertexIndex),
          positions.getY(vertexIndex),
          positions.getZ(vertexIndex)
        );
        const newPos = currentPos.add(offset);
        positions.setXYZ(vertexIndex, newPos.x, newPos.y, newPos.z);
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      return {
        draggedEdge: {
          ...state.draggedEdge,
          midpoint: position.clone()
        }
      };
    }),

  endEdgeDrag: () => set({ draggedEdge: null }),

  setIsDraggingEdge: (isDragging) => set({ isDraggingEdge: isDragging }),

  updateCylinderVertices: (vertexCount) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh) || 
          !(state.selectedObject.geometry instanceof THREE.CylinderGeometry)) {
        return state;
      }

      const oldGeometry = state.selectedObject.geometry;
      const newGeometry = new THREE.CylinderGeometry(
        oldGeometry.parameters.radiusTop,
        oldGeometry.parameters.radiusBottom,
        oldGeometry.parameters.height,
        vertexCount,
        oldGeometry.parameters.heightSegments,
        oldGeometry.parameters.openEnded,
        oldGeometry.parameters.thetaStart,
        oldGeometry.parameters.thetaLength
      );

      state.selectedObject.geometry.dispose();
      state.selectedObject.geometry = newGeometry;

      return {
        ...state,
        selectedElements: {
          vertices: [],
          edges: [],
          faces: []
        }
      };
    }),

  updateSphereVertices: (vertexCount) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh) || 
          !(state.selectedObject.geometry instanceof THREE.SphereGeometry)) {
        return state;
      }

      const oldGeometry = state.selectedObject.geometry;
      const newGeometry = new THREE.SphereGeometry(
        oldGeometry.parameters.radius,
        vertexCount,
        vertexCount / 2,
        oldGeometry.parameters.phiStart,
        oldGeometry.parameters.phiLength,
        oldGeometry.parameters.thetaStart,
        oldGeometry.parameters.thetaLength
      );

      state.selectedObject.geometry.dispose();
      state.selectedObject.geometry = newGeometry;

      return {
        ...state,
        selectedElements: {
          vertices: [],
          edges: [],
          faces: []
        }
      };
    }),

  // Group management functions
  createGroup: (name, objectIds = []) =>
    set((state) => {
      const newGroup: Group = {
        id: crypto.randomUUID(),
        name,
        expanded: true,
        visible: true,
        objectIds: [...objectIds]
      };

      // Update objects to be part of this group
      const updatedObjects = state.objects.map(obj => 
        objectIds.includes(obj.id) 
          ? { ...obj, groupId: newGroup.id }
          : obj
      );

      return {
        groups: [...state.groups, newGroup],
        objects: updatedObjects
      };
    }),

  removeGroup: (groupId) =>
    set((state) => {
      // Remove group reference from objects
      const updatedObjects = state.objects.map(obj => 
        obj.groupId === groupId 
          ? { ...obj, groupId: undefined }
          : obj
      );

      return {
        groups: state.groups.filter(group => group.id !== groupId),
        objects: updatedObjects
      };
    }),

  addObjectToGroup: (objectId, groupId) =>
    set((state) => {
      const updatedObjects = state.objects.map(obj =>
        obj.id === objectId ? { ...obj, groupId } : obj
      );

      const updatedGroups = state.groups.map(group =>
        group.id === groupId 
          ? { ...group, objectIds: [...group.objectIds, objectId] }
          : group
      );

      return {
        objects: updatedObjects,
        groups: updatedGroups
      };
    }),

  removeObjectFromGroup: (objectId) =>
    set((state) => {
      const obj = state.objects.find(o => o.id === objectId);
      if (!obj?.groupId) return state;

      const updatedObjects = state.objects.map(o =>
        o.id === objectId ? { ...o, groupId: undefined } : o
      );

      const updatedGroups = state.groups.map(group =>
        group.id === obj.groupId
          ? { ...group, objectIds: group.objectIds.filter(id => id !== objectId) }
          : group
      );

      return {
        objects: updatedObjects,
        groups: updatedGroups
      };
    }),

  toggleGroupExpanded: (groupId) =>
    set((state) => ({
      groups: state.groups.map(group =>
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    })),

  toggleGroupVisibility: (groupId) =>
    set((state) => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group) return state;

      const newVisibility = !group.visible;

      // Update group visibility
      const updatedGroups = state.groups.map(g =>
        g.id === groupId ? { ...g, visible: newVisibility } : g
      );

      // Update all objects in the group
      const updatedObjects = state.objects.map(obj =>
        group.objectIds.includes(obj.id) 
          ? { ...obj, visible: newVisibility }
          : obj
      );

      // Clear selection if selected object becomes invisible
      const selectedObj = state.objects.find(obj => obj.object === state.selectedObject);
      const newSelectedObject = (selectedObj && group.objectIds.includes(selectedObj.id) && !newVisibility)
        ? null
        : state.selectedObject;

      return {
        groups: updatedGroups,
        objects: updatedObjects,
        selectedObject: newSelectedObject
      };
    }),

  updateGroupName: (groupId, name) =>
    set((state) => ({
      groups: state.groups.map(group =>
        group.id === groupId ? { ...group, name } : group
      )
    })),

  moveObjectsToGroup: (objectIds, groupId) =>
    set((state) => {
      // Remove objects from their current groups
      const updatedGroups = state.groups.map(group => ({
        ...group,
        objectIds: group.objectIds.filter(id => !objectIds.includes(id))
      }));

      // Add objects to the new group if specified
      const finalGroups = groupId 
        ? updatedGroups.map(group =>
            group.id === groupId
              ? { ...group, objectIds: [...group.objectIds, ...objectIds] }
              : group
          )
        : updatedGroups;

      // Update objects
      const updatedObjects = state.objects.map(obj =>
        objectIds.includes(obj.id) 
          ? { ...obj, groupId }
          : obj
      );

      return {
        groups: finalGroups,
        objects: updatedObjects
      };
    }),
}));