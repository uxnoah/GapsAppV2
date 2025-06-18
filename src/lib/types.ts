// Core data types for GAPS diagram application

export type GapsSection = 'goal' | 'analysis' | 'plan' | 'status'

export interface GapsItem {
  id: string
  text: string
  section: GapsSection
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface GapsDiagram {
  id: string
  title: string
  items: GapsItem[]
  createdAt: Date
  updatedAt: Date
  version: number // For optimistic updates
}

// API request/response types
export interface CreateItemRequest {
  text: string
  section: GapsSection
}

export interface UpdateItemRequest {
  id: string
  text?: string
  section?: GapsSection
  order?: number
}

export interface MoveItemRequest {
  id: string
  targetSection: GapsSection
  targetOrder: number
}

export interface ChippAiUpdateRequest {
  action: 'add_item' | 'move_item' | 'update_item' | 'remove_item' | 'update_title'
  section?: GapsSection
  itemId?: string
  text?: string
  order?: number
  title?: string
  metadata?: Record<string, unknown>
}

// UI state types
export interface DragState {
  isDragging: boolean
  draggedItemId: string | null
  dragOverSection: GapsSection | null
}

export interface DiagramState {
  diagram: GapsDiagram
  isLoading: boolean
  error: string | null
  hasUnsavedChanges: boolean
}

// Utility types
export type ApiResponse<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

export type OptimisticUpdate<T> = {
  type: 'add' | 'update' | 'remove' | 'move'
  payload: T
  tempId?: string
} 