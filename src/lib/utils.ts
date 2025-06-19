/**
 * UTILITY FUNCTIONS FILE (utils.ts)
 * ==================================
 * This file contains helpful "tool" functions that are used throughout our app.
 * Think of these as your toolbox - each function does one specific job well,
 * and other parts of the app can use these tools whenever needed.
 * 
 * These functions handle common tasks like:
 * - Generating unique IDs
 * - Creating new data objects
 * - Organizing and sorting data
 * - Styling and colors
 */

// IMPORTS SECTION
// ===============
import { type ClassValue, clsx } from 'clsx'     // Tools for combining CSS classes
import { twMerge } from 'tailwind-merge'          // Tool for merging Tailwind CSS classes intelligently
import { GapsItem, GapsSection, GapsDiagram } from './types' // Our custom data types

// =============================================================================
// CSS STYLING UTILITIES
// =============================================================================

/**
 * CLASS NAME UTILITY (cn)
 * =======================
 * This function helps combine CSS classes in a smart way.
 * It prevents conflicts and removes duplicates automatically.
 * 
 * Example: cn('bg-blue-500', 'bg-red-500') → 'bg-red-500' (keeps the last one)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================================================
// ID GENERATION UTILITIES
// =============================================================================

/**
 * GENERATE UNIQUE ID
 * ==================
 * Creates a unique identifier for new items or diagrams.
 * Combines current timestamp with random characters to ensure uniqueness.
 * 
 * Example output: "1704067200000-x7k9m2p3q"
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  //      ^timestamp    ^random letters/numbers
}

// =============================================================================
// DATA CREATION UTILITIES
// =============================================================================

/**
 * CREATE DEFAULT DIAGRAM
 * =======================
 * Creates a brand new, empty GAPS diagram with default settings.
 * Used when starting fresh or initializing the app.
 */
export function createDefaultDiagram(): GapsDiagram {
  const now = new Date() // Current date/time
  return {
    id: generateId(),              // Give it a unique ID
    title: 'My GAPS Diagram',      // Default title
    items: [],                     // Start with no items
    createdAt: now,                // When it was created
    updatedAt: now,                // When it was last updated (same as created for new diagrams)
    version: 1                     // Start at version 1
  }
}

/**
 * CREATE NEW GAPS ITEM
 * ====================
 * Creates a new item for the diagram with the given text and section.
 * All new items start with order 0 (will be adjusted when added to diagram).
 */
export function createGapsItem(text: string, section: GapsSection): GapsItem {
  const now = new Date() // Current date/time
  return {
    id: generateId(),        // Give it a unique ID
    text,                    // The content the user entered
    section,                 // Which section it belongs to (goal, analysis, etc.)
    order: 0,                // Position in the list (will be set properly when added)
    createdAt: now,          // When it was created
    updatedAt: now           // When it was last updated
  }
}

// =============================================================================
// DATA ORGANIZATION UTILITIES
// =============================================================================

/**
 * SORT ITEMS BY ORDER
 * ===================
 * Takes a list of items and sorts them by their 'order' property.
 * Lower numbers come first (0, 1, 2, 3...).
 * Returns a NEW array (doesn't modify the original).
 */
export function sortItemsByOrder(items: GapsItem[]): GapsItem[] {
  return [...items].sort((a, b) => a.order - b.order)
  //     ^make copy  ^sort by comparing order numbers
}

/**
 * GET ITEMS FOR SPECIFIC SECTION
 * ==============================
 * Filters items to only show those from one section, then sorts them by order.
 * 
 * Example: getItemsBySection(allItems, 'goal') → only goal items, in order
 */
export function getItemsBySection(items: GapsItem[], section: GapsSection): GapsItem[] {
  return sortItemsByOrder(items.filter(item => item.section === section))
  //                              ^keep only items from this section
}

// =============================================================================
// STYLING AND THEMING UTILITIES
// =============================================================================

/**
 * GET SECTION COLORS
 * ==================
 * Returns the color scheme for each section of the GAPS diagram.
 * Each section has its own color theme for visual distinction.
 */
export function getSectionColors(section: GapsSection) {
  const colorMap = {
    // GOAL SECTION - Blue theme (represents aspirations, sky, future)
    goal: {
      bg: 'bg-blue-50',           // Very light blue background
      border: 'border-blue-200',   // Light blue border
      text: 'text-blue-800',      // Dark blue text
      hover: 'hover:bg-blue-100'  // Slightly darker blue when hovering
    },
    // ANALYSIS SECTION - Green theme (represents growth, understanding)
    analysis: {
      bg: 'bg-green-50',          // Very light green background
      border: 'border-green-200',  // Light green border
      text: 'text-green-800',     // Dark green text
      hover: 'hover:bg-green-100' // Slightly darker green when hovering
    },
    // PLAN SECTION - Yellow theme (represents action, energy, planning)
    plan: {
      bg: 'bg-yellow-50',         // Very light yellow background
      border: 'border-yellow-200', // Light yellow border
      text: 'text-yellow-800',    // Dark yellow text
      hover: 'hover:bg-yellow-100' // Slightly darker yellow when hovering
    },
    // STATUS SECTION - Purple theme (represents current state, present)
    status: {
      bg: 'bg-purple-50',         // Very light purple background
      border: 'border-purple-200', // Light purple border
      text: 'text-purple-800',    // Dark purple text
      hover: 'hover:bg-purple-100' // Slightly darker purple when hovering
    }
  }
  
  return colorMap[section] // Return the color scheme for the requested section
}

/**
 * GET SECTION DISPLAY NAME
 * ========================
 * Converts the internal section name to a user-friendly display name.
 * The internal names are lowercase, but we want to show them capitalized.
 */
export function getSectionDisplayName(section: GapsSection): string {
  const displayMap = {
    goal: 'Goal',         // What we want to achieve
    analysis: 'Analysis', // Understanding the gap between current and goal
    plan: 'Plan',         // Steps to bridge the gap
    status: 'Status'      // Current situation
  }
  
  return displayMap[section]
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * VALIDATE SECTION VALUE
 * ======================
 * Checks if a given string is a valid section name.
 * This is useful when receiving data from external sources (like Chipp AI).
 * 
 * The 'value is GapsSection' part is a TypeScript feature that tells
 * the compiler "if this function returns true, then value is definitely a GapsSection"
 */
export function isValidSection(value: string): value is GapsSection {
  return ['goal', 'analysis', 'plan', 'status'].includes(value)
  //      ^check if the value is one of our valid section names
} 