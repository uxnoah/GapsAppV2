import {
  cn,
  generateId,
  createDefaultDiagram,
  createGapsItem,
  sortItemsByOrder,
  getItemsBySection,
  getSectionColors,
  getSectionDisplayName,
  isValidSection
} from '../utils'
import { GapsItem } from '../types'

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      const result = cn('text-lg', 'font-bold', undefined, 'text-blue-500')
      expect(typeof result).toBe('string')
      expect(result).toContain('text-lg')
      expect(result).toContain('font-bold')
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
      expect(id1).not.toBe(id2)
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('createDefaultDiagram', () => {
    it('should create a default diagram with required properties', () => {
      const diagram = createDefaultDiagram()
      
      expect(diagram.id).toBeTruthy()
      expect(diagram.title).toBe('My GAPS Diagram')
      expect(Array.isArray(diagram.items)).toBe(true)
      expect(diagram.items.length).toBe(0)
      expect(diagram.version).toBe(1)
      expect(diagram.createdAt).toBeInstanceOf(Date)
      expect(diagram.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('createGapsItem', () => {
    it('should create a GAPS item with correct properties', () => {
      const item = createGapsItem('Test item', 'goal')
      
      expect(item.id).toBeTruthy()
      expect(item.text).toBe('Test item')
      expect(item.section).toBe('goal')
      expect(item.order).toBe(0)
      expect(item.createdAt).toBeInstanceOf(Date)
      expect(item.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('sortItemsByOrder', () => {
    it('should sort items by order property', () => {
      const items: GapsItem[] = [
        createGapsItem('Item 3', 'goal'),
        createGapsItem('Item 1', 'goal'),
        createGapsItem('Item 2', 'goal')
      ]
      
      // Set different orders
      items[0].order = 3
      items[1].order = 1
      items[2].order = 2
      
      const sorted = sortItemsByOrder(items)
      
      expect(sorted[0].order).toBe(1)
      expect(sorted[1].order).toBe(2)
      expect(sorted[2].order).toBe(3)
    })
  })

  describe('getItemsBySection', () => {
    it('should filter items by section and sort them', () => {
      const items: GapsItem[] = [
        createGapsItem('Goal 1', 'goal'),
        createGapsItem('Analysis 1', 'analysis'),
        createGapsItem('Goal 2', 'goal'),
      ]
      
      items[0].order = 2
      items[2].order = 1
      
      const goalItems = getItemsBySection(items, 'goal')
      
      expect(goalItems.length).toBe(2)
      expect(goalItems[0].order).toBe(1)
      expect(goalItems[1].order).toBe(2)
      expect(goalItems.every(item => item.section === 'goal')).toBe(true)
    })
  })

  describe('getSectionColors', () => {
    it('should return correct colors for each section', () => {
      const goalColors = getSectionColors('goal')
      const analysisColors = getSectionColors('analysis')
      const planColors = getSectionColors('plan')
      const statusColors = getSectionColors('status')
      
      expect(goalColors.bg).toBe('bg-blue-50')
      expect(goalColors.text).toBe('text-blue-800')
      
      expect(analysisColors.bg).toBe('bg-green-50')
      expect(analysisColors.text).toBe('text-green-800')
      
      expect(planColors.bg).toBe('bg-yellow-50')
      expect(planColors.text).toBe('text-yellow-800')
      
      expect(statusColors.bg).toBe('bg-purple-50')
      expect(statusColors.text).toBe('text-purple-800')
    })
  })

  describe('getSectionDisplayName', () => {
    it('should return correct display names', () => {
      expect(getSectionDisplayName('goal')).toBe('Goal')
      expect(getSectionDisplayName('analysis')).toBe('Analysis')
      expect(getSectionDisplayName('plan')).toBe('Plan')
      expect(getSectionDisplayName('status')).toBe('Status')
    })
  })

  describe('isValidSection', () => {
    it('should validate section values correctly', () => {
      expect(isValidSection('goal')).toBe(true)
      expect(isValidSection('analysis')).toBe(true)
      expect(isValidSection('plan')).toBe(true)
      expect(isValidSection('status')).toBe(true)
      
      expect(isValidSection('invalid')).toBe(false)
      expect(isValidSection('')).toBe(false)
      expect(isValidSection('Goal')).toBe(false) // case sensitive
    })
  })
}) 