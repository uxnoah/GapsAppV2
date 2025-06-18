import {
  GapsItem,
  GapsDiagram,
  GapsSection,
  CreateItemRequest,
  UpdateItemRequest,
  MoveItemRequest,
  ChippAiUpdateRequest,
  DragState,
  DiagramState,
  ApiResponse,
  OptimisticUpdate
} from '../types'

describe('TypeScript Types', () => {
  describe('GapsItem', () => {
    it('should create a valid GapsItem', () => {
      const item: GapsItem = {
        id: '123',
        text: 'Test item',
        section: 'goal',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      expect(item.id).toBe('123')
      expect(item.text).toBe('Test item')
      expect(item.section).toBe('goal')
      expect(item.order).toBe(1)
    })
  })

  describe('GapsDiagram', () => {
    it('should create a valid GapsDiagram', () => {
      const diagram: GapsDiagram = {
        id: 'diagram-1',
        title: 'My GAPS Diagram',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      }
      
      expect(diagram.id).toBe('diagram-1')
      expect(diagram.title).toBe('My GAPS Diagram')
      expect(Array.isArray(diagram.items)).toBe(true)
      expect(diagram.version).toBe(1)
    })
  })

  describe('API Request Types', () => {
    it('should validate CreateItemRequest', () => {
      const request: CreateItemRequest = {
        text: 'New item',
        section: 'analysis'
      }
      
      expect(request.text).toBe('New item')
      expect(request.section).toBe('analysis')
    })

    it('should validate UpdateItemRequest', () => {
      const request: UpdateItemRequest = {
        id: '123',
        text: 'Updated text',
        section: 'plan'
      }
      
      expect(request.id).toBe('123')
      expect(request.text).toBe('Updated text')
      expect(request.section).toBe('plan')
    })

    it('should validate MoveItemRequest', () => {
      const request: MoveItemRequest = {
        id: '123',
        targetSection: 'status',
        targetOrder: 2
      }
      
      expect(request.id).toBe('123')
      expect(request.targetSection).toBe('status')
      expect(request.targetOrder).toBe(2)
    })
  })

  describe('ChippAi Integration Types', () => {
    it('should validate ChippAiUpdateRequest for adding item', () => {
      const request: ChippAiUpdateRequest = {
        action: 'add_item',
        section: 'goal',
        text: 'AI added item'
      }
      
      expect(request.action).toBe('add_item')
      expect(request.section).toBe('goal')
      expect(request.text).toBe('AI added item')
    })

    it('should validate ChippAiUpdateRequest for updating title', () => {
      const request: ChippAiUpdateRequest = {
        action: 'update_title',
        title: 'New Title'
      }
      
      expect(request.action).toBe('update_title')
      expect(request.title).toBe('New Title')
    })
  })

  describe('UI State Types', () => {
    it('should validate DragState', () => {
      const dragState: DragState = {
        isDragging: true,
        draggedItemId: '123',
        dragOverSection: 'analysis'
      }
      
      expect(dragState.isDragging).toBe(true)
      expect(dragState.draggedItemId).toBe('123')
      expect(dragState.dragOverSection).toBe('analysis')
    })

    it('should validate DiagramState', () => {
      const diagram: GapsDiagram = {
        id: 'test',
        title: 'Test',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      }

      const state: DiagramState = {
        diagram,
        isLoading: false,
        error: null,
        hasUnsavedChanges: false
      }
      
      expect(state.diagram).toBe(diagram)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe(null)
      expect(state.hasUnsavedChanges).toBe(false)
    })
  })

  describe('Utility Types', () => {
    it('should validate successful ApiResponse', () => {
      const response: ApiResponse<string> = {
        success: true,
        data: 'test data'
      }
      
      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data).toBe('test data')
      }
    })

    it('should validate error ApiResponse', () => {
      const response: ApiResponse<string> = {
        success: false,
        error: 'Something went wrong'
      }
      
      expect(response.success).toBe(false)
      if (!response.success) {
        expect(response.error).toBe('Something went wrong')
      }
    })
  })

  describe('GapsSection Type', () => {
    it('should only allow valid section values', () => {
      const validSections: GapsSection[] = ['goal', 'analysis', 'plan', 'status']
      
      validSections.forEach(section => {
        const item: GapsItem = {
          id: '1',
          text: 'test',
          section,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        expect(item.section).toBe(section)
      })
    })
  })
}) 