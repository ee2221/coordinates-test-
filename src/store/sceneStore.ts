import { create } from 'zustand';
import * as THREE from 'three';

type EditMode = 'vertex' | 'edge' | null;

interface SceneState {
  objects: Array<{
    id: string;
    object: THREE.Object3D;
    name: string;
    visible: boolean;
  }>;
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
  isChangingVertexCoordinates: boolean;
  pendingVertexChanges: {
    indices: number[];
    newPosition: THREE.Vector3;
    originalPosition: THREE.Vector3;
  } | null;
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
  startVertexCoordinateChange: (newPosition: THREE.Vector3) => void;
  applyVertexCoordinateChanges: () => void;
  cancelVertexCoordinateChanges: () => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
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
  isChangingVertexCoordinates: false,
  pendingVertexChanges: null,

  addObject: (object, name) =>
    set((state) => ({
      objects: [...state.objects, { id: crypto.randomUUID(), object, name, visible: true }],
    })),

  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObject: state.objects.find((obj) => obj.id === id)?.object === state.selectedObject
        ? null
        : state.selectedObject,
    })),

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
        transformMode: null, // Clear transform mode when selecting object
        isChangingVertexCoordinates: false,
        pendingVertexChanges: null
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
      return { 
        editMode: mode,
        isChangingVertexCoordinates: false,
        pendingVertexChanges: null
      };
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
        },
        isChangingVertexCoordinates: false,
        pendingVertexChanges: null
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

  endVertexDrag: () => set({ 
    draggedVertex: null,
    isChangingVertexCoordinates: false,
    pendingVertexChanges: null
  }),

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

  startVertexCoordinateChange: (newPosition) =>
    set((state) => {
      if (!state.draggedVertex || !(state.selectedObject instanceof THREE.Mesh)) return state;

      // Store the original position if this is the first coordinate change
      if (!state.isChangingVertexCoordinates) {
        return {
          isChangingVertexCoordinates: true,
          pendingVertexChanges: {
            indices: state.draggedVertex.indices,
            newPosition: newPosition.clone(),
            originalPosition: state.draggedVertex.initialPosition.clone()
          }
        };
      } else {
        // Update the pending changes
        return {
          pendingVertexChanges: state.pendingVertexChanges ? {
            ...state.pendingVertexChanges,
            newPosition: newPosition.clone()
          } : null
        };
      }
    }),

  applyVertexCoordinateChanges: () =>
    set((state) => {
      if (!state.pendingVertexChanges || !(state.selectedObject instanceof THREE.Mesh)) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      
      // Apply the final position to all overlapping vertices
      state.pendingVertexChanges.indices.forEach(index => {
        positions.setXYZ(
          index,
          state.pendingVertexChanges!.newPosition.x,
          state.pendingVertexChanges!.newPosition.y,
          state.pendingVertexChanges!.newPosition.z
        );
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();

      // Update the draggedVertex position to match
      const newDraggedVertex = state.draggedVertex ? {
        ...state.draggedVertex,
        position: state.pendingVertexChanges.newPosition.clone(),
        initialPosition: state.pendingVertexChanges.newPosition.clone()
      } : null;

      return {
        isChangingVertexCoordinates: false,
        pendingVertexChanges: null,
        draggedVertex: newDraggedVertex
      };
    }),

  cancelVertexCoordinateChanges: () =>
    set((state) => {
      if (!state.pendingVertexChanges || !(state.selectedObject instanceof THREE.Mesh)) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      
      // Restore the original position
      state.pendingVertexChanges.indices.forEach(index => {
        positions.setXYZ(
          index,
          state.pendingVertexChanges!.originalPosition.x,
          state.pendingVertexChanges!.originalPosition.y,
          state.pendingVertexChanges!.originalPosition.z
        );
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();

      return {
        isChangingVertexCoordinates: false,
        pendingVertexChanges: null
      };
    }),

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
}));