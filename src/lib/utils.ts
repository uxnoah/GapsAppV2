import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { GapsItem, GapsSection, GapsDiagram } from './types'

// Utility function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate unique ID for items
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Create a default GAPS diagram
export function createDefaultDiagram(): GapsDiagram {
  const now = new Date()
  return {
    id: generateId(),
    title: 'My GAPS Diagram',
    items: [],
    createdAt: now,
    updatedAt: now,
    version: 1
  }
}

// Create a new GAPS item
export function createGapsItem(text: string, section: GapsSection): GapsItem {
  const now = new Date()
  return {
    id: generateId(),
    text,
    section,
    order: 0, // Will be set when added to diagram
    createdAt: now,
    updatedAt: now
  }
}

// Sort items within a section by order
export function sortItemsByOrder(items: GapsItem[]): GapsItem[] {
  return [...items].sort((a, b) => a.order - b.order)
}

// Get items for a specific section
export function getItemsBySection(items: GapsItem[], section: GapsSection): GapsItem[] {
  return sortItemsByOrder(items.filter(item => item.section === section))
}

// Get section color classes
export function getSectionColors(section: GapsSection) {
  const colorMap = {
    goal: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      hover: 'hover:bg-blue-100'
    },
    analysis: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      hover: 'hover:bg-green-100'
    },
    plan: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      hover: 'hover:bg-yellow-100'
    },
    status: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      hover: 'hover:bg-purple-100'
    }
  }
  
  return colorMap[section]
}

// Get section display name
export function getSectionDisplayName(section: GapsSection): string {
  const displayMap = {
    goal: 'Goal',
    analysis: 'Analysis',
    plan: 'Plan',
    status: 'Status'
  }
  
  return displayMap[section]
}

// Validate section value
export function isValidSection(value: string): value is GapsSection {
  return ['goal', 'analysis', 'plan', 'status'].includes(value)
} 