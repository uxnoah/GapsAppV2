/**
 * TYPES DEFINITION FILE (types.ts)
 * =================================
 * This file defines the "shape" of all data used in our application.
 * Think of these as blueprints that tell TypeScript what properties
 * each piece of data should have. This helps prevent bugs and makes
 * the code more reliable.
 * 
 * Analogy: If our data were LEGO sets, these types would be the
 * instruction booklets that show what pieces go where.
 */

// =============================================================================
// CORE DATA TYPES - The building blocks of our GAPS diagram
// =============================================================================

/**
 * GAPS SECTION TYPE
 * =================
 * Defines the four possible sections in our GAPS diagram.
 * The '|' symbol means "or" - so a GapsSection can be any ONE of these values.
 */
export type GapsSection = 'goal' | 'analysis' | 'plan' | 'status'

/**
 * GAPS ITEM INTERFACE
 * ===================
 * This describes what every individual item in our diagram looks like.
 * An 'interface' is like a contract - any GapsItem MUST have all these properties.
 */
export interface GapsItem {
  id: string           // Unique identifier (like a barcode for each item)
  text: string         // The actual content the user sees/edits
  section: GapsSection // Which of the 4 sections this item belongs to
  order: number        // Position within its section (0 = first, 1 = second, etc.)
  createdAt: Date      // When this item was first created
  updatedAt: Date      // When this item was last modified
}

/**
 * GAPS DIAGRAM INTERFACE
 * ======================
 * This describes the entire diagram that contains all items.
 * Think of this as the "container" that holds everything.
 */
export interface GapsDiagram {
  id: string           // Unique identifier for this diagram
  title: string        // The main title shown at the top
  items: GapsItem[]    // Array (list) of all items in the diagram
  createdAt: Date      // When this diagram was first created
  updatedAt: Date      // When this diagram was last modified
  version: number      // Version number for tracking changes (like document versions)
}

// =============================================================================
// API REQUEST/RESPONSE TYPES - How we communicate with the server
// =============================================================================

// Convenience alias for API-facing section type
export type Section = GapsSection

// Shape of a thought in API responses
export interface ThoughtApi {
  id?: string
  text?: string
  section?: Section
  order?: number
  tags?: string[]
  priority?: string
  status?: string
  aiGenerated?: boolean
  confidence?: number
  metadata?: Record<string, unknown>
  createdAt?: string | Date
  updatedAt?: string | Date
}

// Canonical API Thought payload (DTO) returned by thought endpoints
export interface ThoughtDto {
  id: number
  content: string
  section: Section
  order: number
  tags?: string[]
  priority?: string
  status?: string
  aiGenerated?: boolean
  confidence?: number
  metadata?: Record<string, unknown>
  createdAt?: string | Date
  updatedAt?: string | Date
}

// Standard success envelope for thought endpoints
export interface ThoughtResponse {
  success: true
  thought: ThoughtDto
}

// Requests for thought endpoints
export interface ThoughtCreateRequest {
  content: string
  section: Section
  tags?: string[]
  priority?: string
  status?: string
  aiGenerated?: boolean
  confidence?: number
  metadata?: Record<string, unknown>
}

export interface ThoughtUpdateRequest {
  content: string
  tags?: string[]
  priority?: string
  status?: string
  aiGenerated?: boolean
  confidence?: number
  metadata?: Record<string, unknown>
}

export interface ThoughtMoveRequest {
  targetSection: Section
  targetIndex: number
}

// Shape of the diagram in API responses
export interface DiagramApi {
  id: number
  title: string
  thoughts: ThoughtApi[]
}

/**
 * CREATE ITEM REQUEST
 * ===================
 * Data structure for when we want to create a new item
 */
export interface CreateItemRequest {
  text: string         // The content of the new item
  section: GapsSection // Which section to put it in
}

/**
 * UPDATE ITEM REQUEST
 * ===================
 * Data structure for when we want to modify an existing item
 * The '?' means these properties are optional - you only need to include what you're changing
 */
export interface UpdateItemRequest {
  id: string           // Which item to update (required)
  text?: string        // New text content (optional)
  section?: GapsSection // New section (optional)
  order?: number       // New position (optional)
}

/**
 * MOVE ITEM REQUEST
 * =================
 * Data structure for when we drag/drop an item to a new location
 */
export interface MoveItemRequest {
  id: string              // Which item to move
  targetSection: GapsSection // Where to move it
  targetOrder: number     // What position in the new section
}

/**
 * CHIPP AI UPDATE REQUEST
 * =======================
 * Data structure for when Chipp.ai sends us updates
 * This handles all the different types of changes Chipp might make
 */
export interface ChippAiUpdateRequest {
  action: 'add_item' | 'move_item' | 'update_item' | 'remove_item' | 'update_title' // What type of change
  section?: GapsSection     // Which section (if relevant)
  itemId?: string          // Which item (if relevant)
  text?: string            // New text content (if relevant)
  order?: number           // New position (if relevant)
  title?: string           // New title (if relevant)
  metadata?: Record<string, unknown> // Extra data Chipp might send
}

// =============================================================================
// UI STATE TYPES - How we track what's happening in the user interface
// =============================================================================

/**
 * DRAG STATE
 * ==========
 * Keeps track of drag and drop operations
 */
export interface DragState {
  isDragging: boolean          // Is the user currently dragging something?
  draggedItemId: string | null // Which item is being dragged (null = none)
  dragOverSection: GapsSection | null // Which section is the mouse hovering over
}

/**
 * DIAGRAM STATE
 * =============
 * Keeps track of the overall state of our diagram interface
 */
export interface DiagramState {
  diagram: GapsDiagram        // The actual diagram data
  isLoading: boolean          // Are we waiting for something to load?
  error: string | null        // Any error message to show (null = no error)
  hasUnsavedChanges: boolean  // Does the user have unsaved work?
}

// =============================================================================
// UTILITY TYPES - Helper types for common patterns
// =============================================================================

/**
 * API RESPONSE TYPE
 * =================
 * A flexible way to handle success/failure responses from our server
 * This ensures every API call returns either success with data OR failure with error
 */
export type ApiResponse<T> = {
  success: true   // The call worked
  data: T        // The data we got back (T is a placeholder for any type)
} | {
  success: false // The call failed
  error: string  // What went wrong
}

/**
 * OPTIMISTIC UPDATE TYPE
 * ======================
 * For making the UI feel fast by showing changes before the server confirms them
 * "Optimistic" means we assume the change will work and show it immediately
 */
export type OptimisticUpdate<T> = {
  type: 'add' | 'update' | 'remove' | 'move' // What kind of change
  payload: T      // The data for this change
  tempId?: string // Temporary ID while waiting for server confirmation
} 