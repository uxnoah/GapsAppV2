'use client'

import React, { useState } from 'react'
import { GapsSection, GapsItem, GapsDiagram, ThoughtApi, DiagramApi } from '@/lib/types'
import { 
  createDefaultDiagram, 
  createGapsItem, 
  getItemsBySection, 
  getSectionDisplayName,
  generateId 
} from '@/lib/utils'
import { GapsBox } from './gaps-box'
import { GapsItemComponent } from './gaps-item'
import { api, routes, getApiErrorMessage } from '@/lib/api'
import type { ThoughtResponse } from '@/lib/types'


//
// Developer note: This file uses the centralized API wrapper (`src/lib/api.ts`).
// All network errors are normalized to `ApiError`; UI logs use `getApiErrorMessage`.
// Thought responses conform to `ThoughtResponse` with a `thought` DTO (id, content, section, order, ...).

/**
 * GAPS Canvas Component - Main Application Container
 * 
 * This is the core component that orchestrates the entire GAPS diagram application.
 * It manages the state, handles all user interactions, and coordinates between
 * the UI components and the backend API.
 * 
 * Architecture Overview:
 * - State Management: Manages all application state (diagram data, UI state, etc.)
 * - API Integration: Handles all communication with the backend
 * - Event Handling: Processes all user interactions (drag/drop, editing, etc.)
 * - Component Coordination: Orchestrates the four GAPS boxes and individual items
 * 
 * Key Responsibilities:
 * 1. Load and save diagram data to/from the database
 * 2. Handle drag-and-drop operations between sections
 * 3. Manage inline editing of items and titles
 * 4. Coordinate AI simulation and external updates
 * 5. Provide debugging and testing functionality
 */

// =============================================================================
// INTERFACE DEFINITIONS
// =============================================================================

// 🧠 MY THOUGHTS: 
// ❓ QUESTION: 

// Data structure for tracking drag operations
interface DragData {
  itemId: string
  sourceSection: GapsSection
  sourceIndex: number
}

// Visual indicator for showing where items can be dropped
interface DropIndicator {
  section: GapsSection
  index: number
}

export const GapsCanvas = () => {


  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================
  
  // 🧠 MY THOUGHTS: The state is organized into logical groups - core data, UI state, and DOM refs
  // State variables are explicitly separated for clarity; consider extracting to a custom hook later.
  
  // Default diagram for loading state
  const defaultDiagram: GapsDiagram = {
    id: 'loading',
    title: 'Loading...',
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  }

  // Core diagram data - the main application state
  const [diagram, setDiagram] = useState<GapsDiagram>(defaultDiagram)

  // UI State - controls various interface behaviors
  const [editingItemId, setEditingItemId] = useState<string | null>(null)  // Which item is being edited
  const [editText, setEditText] = useState('')                             // Current edit text
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)  // Drag/drop visual feedback
  const [editingMainTitle, setEditingMainTitle] = useState(false)         // Main title editing state
  const [editMainTitleText, setEditMainTitleText] = useState('')          // Main title edit text
  const [titleClickPosition, setTitleClickPosition] = useState<number | null>(null)  // Cursor position for title editing
  const [isDragging, setIsDragging] = useState(false)                     // Global drag state
  const [isThinking, setIsThinking] = useState(false)                     // AI processing overlay

  // DOM References - for programmatic access to elements
  const titleInputRef = React.useRef<HTMLInputElement>(null)  // Main title input field
  const titleSpanRef = React.useRef<HTMLHeadingElement>(null) // Main title display element

  // =============================================================================
  // API INTEGRATION FUNCTIONS
  // =============================================================================

  /*
   * Shows a loading state while data is fetched
   * Loads the current diagram data from the backend API
   * This function fetches the complete diagram state including all thoughts/items
   * and their metadata from the database.
   */
  const loadDiagramFromAPI = async () => {
    try {
      const data: DiagramApi = await api.get<DiagramApi>(routes.diagram)
      // Map API ThoughtDto-like records to strict GapsItem with safe defaults
      // - content -> text
      // - section stays the same
      // - order stays the same
      // - createdAt/updatedAt coerced to Date
      const items: GapsItem[] = Array.isArray(data.thoughts)
        ? data.thoughts.map((thought: ThoughtApi) => ({
            id: String(thought.id ?? generateId()),
            text: String(thought.text ?? ''),
            section: (thought.section ?? 'status') as GapsSection,
            order: Number(thought.order ?? 0),
            createdAt: new Date(thought.createdAt ?? Date.now()),
            updatedAt: new Date(thought.updatedAt ?? Date.now()),
          }))
        : []

        setDiagram({
          id: String(data.id ?? generateId()), // Use API ID or generate new one
          title: data.title || 'GAPS Diagram',
          items,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        })
        console.log('✅ Diagram loaded (items:', items.length, ')')
    } catch (error) {
      console.error('Failed to load diagram from API:', getApiErrorMessage(error))
    }
  }

  // ===== INITIALIZATION =====
  
  // Load data on component mount
  React.useEffect(() => {
    loadDiagramFromAPI()
  }, [])

  // Set cursor position when title input becomes active
  React.useEffect(() => {
    if (editingMainTitle && titleInputRef.current && titleClickPosition !== null) {
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.setSelectionRange(titleClickPosition, titleClickPosition)
        }
      }, 0)
    }
  }, [editingMainTitle, titleClickPosition])

  // Show loading state while diagram is still default
  if (diagram.id === 'loading' && diagram.items.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // ===== TESTING AND SIMULATION FUNCTIONS =====
  
  /**
   * Test function to send sample data to API
   * This simulates loading test data into the diagram for development/testing purposes
   */
  const sendTestDataToAPI = async () => {
    console.log('💬 User: "Load some test data into my diagram"')
    setIsThinking(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      const testData = {
        title: 'Test Data from Frontend',
        status: ['Status item 1', 'Status item 2'],
        goal: ['Goal item 1', 'Goal item 2'], 
        analysis: ['Analysis item 1', 'Analysis item 2'],
        plan: ['Plan item 1', 'Plan item 2']
      }
      
      await api.put(routes.diagram, testData)

      // Update the frontend using the same data we sent (since this is a simulation)
      {
        const diagramData = testData
          const items: GapsItem[] = []
          let idCounter = 1

          // Convert response data to frontend format
          diagramData.status?.forEach((text: string, index: number) => {
            items.push({
              id: `status-${idCounter++}`,
              text,
              section: 'status',
              order: index,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          })

          diagramData.goal?.forEach((text: string, index: number) => {
            items.push({
              id: `goal-${idCounter++}`,
              text,
              section: 'goal',
              order: index,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          })

          diagramData.analysis?.forEach((text: string, index: number) => {
            items.push({
              id: `analysis-${idCounter++}`,
              text,
              section: 'analysis',
              order: index,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          })

          diagramData.plan?.forEach((text: string, index: number) => {
            items.push({
              id: `plan-${idCounter++}`,
              text,
              section: 'plan',
              order: index,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          })

        setDiagram(prev => ({
          ...prev,
          title: diagramData.title || '',
          items,
          updatedAt: new Date()
        }))
      }

        // AI notifies completion
        await fetch('/api/ai-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hasChanges: true,
            message: 'Test data loaded into diagram'
          })
        })
        
      setIsThinking(false)
      console.log('🤖 AI: "I\'ve loaded test data into your diagram!"')
    } catch (error) {
      console.error('🧪 Error sending test data:', getApiErrorMessage(error))
      setIsThinking(false)
    }
  }

  // API Simulation Functions
  const simulateAddThought = async () => {
    console.log('💬 User: "Add a new thought to my diagram"')
    setIsThinking(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 900))
    
    try {
      // Simulate external API call to add a thought (via wrapper)
      const result = await api.post<ThoughtResponse>(
        routes.thoughts,
        { 
          content: `AI Suggestion: Optimize database queries (${new Date().toLocaleTimeString()})`,
          section: 'plan',
          aiGenerated: true,
          confidence: 0.85,
          tags: ['ai-generated', 'performance'],
          priority: 'medium'
        }
      )

      // Refresh diagram to show the change (simulating external update)
      await loadDiagramFromAPI()
      
      // AI notifies completion (keep raw fetch; not part of user-facing API)
      await fetch('/api/ai-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasChanges: true,
          message: 'New thought added to diagram'
        })
      })
      
      setIsThinking(false)
      console.log('🤖 AI: "I\'ve added a new thought to your diagram!"')
    } catch (error) {
      console.error('❌ Error in simulated add:', getApiErrorMessage(error))
      setIsThinking(false)
    }
  }

  const simulateEditThought = async () => {
    console.log('💬 User: "Edit one of my thoughts"')
    setIsThinking(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 750))
    
    // Find any thought to edit
    const existingThoughts = diagram.items.filter(item => item.id && !isNaN(Number(item.id)))
    
    if (existingThoughts.length === 0) {
      setIsThinking(false)
      return
    }
    
    const randomThought = existingThoughts[Math.floor(Math.random() * existingThoughts.length)]
    
    try {
      // Simulate external API call to edit a thought
      await api.put<ThoughtResponse>(
        routes.thoughtById(String(randomThought.id)),
        {
          content: `${randomThought.text} (AI Enhanced: ${new Date().toLocaleTimeString()})`,
          priority: 'high',
          tags: ['ai-enhanced', 'updated'],
          confidence: 0.92,
        }
      )

      // Refresh diagram to show the change
      await loadDiagramFromAPI()
      
      // AI notifies completion
      await fetch('/api/ai-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasChanges: true,
          message: 'Thought edited successfully'
        })
      })
      
      setIsThinking(false)
      console.log('🤖 AI: "I\'ve enhanced one of your thoughts!"')
    } catch (error) {
      console.error('❌ Error in simulated edit:', getApiErrorMessage(error))
      setIsThinking(false)
    }
  }

  const simulateDeleteThought = async () => {
    console.log('💬 User: "Delete one of my thoughts"')
    setIsThinking(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // Find any thought to delete
    const existingThoughts = diagram.items.filter(item => item.id && !isNaN(Number(item.id)))
    
    if (existingThoughts.length === 0) {
      setIsThinking(false)
      return
    }
    
    const randomThought = existingThoughts[Math.floor(Math.random() * existingThoughts.length)]
    console.log('🗑️ Deleting thought:', randomThought.id, randomThought.text.substring(0, 30))
    
    try {
      // Simulate external API call to delete a thought
      await api.del<void>(routes.thoughtById(String(randomThought.id)))
      console.log('✅ Delete successful')

      // Refresh diagram to show the change
      await loadDiagramFromAPI()
      
      // AI notifies completion
      await fetch('/api/ai-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasChanges: true,
          message: 'Thought deleted successfully'
        })
      })
      
      setIsThinking(false)
      console.log('🤖 AI: "I\'ve removed that thought from your diagram!"')
    } catch (error) {
      console.error('❌ Error in simulated delete:', getApiErrorMessage(error))
      setIsThinking(false)
    }
  }

  const simulateMoveThought = async () => {
    console.log('💬 User: "Move one of my thoughts to a different section"')
    setIsThinking(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Find any thought to move
    const existingThoughts = diagram.items.filter(item => item.id && !isNaN(Number(item.id)))
    
    if (existingThoughts.length === 0) {
      setIsThinking(false)
      return
    }
    
    const randomThought = existingThoughts[Math.floor(Math.random() * existingThoughts.length)]
    const sections = ['status', 'goal', 'analysis', 'plan']
    const targetSection = sections[Math.floor(Math.random() * sections.length)]
    const targetIndex = Math.floor(Math.random() * 3) // Random position 0-2
    
    console.log(`🔄 Moving thought ${randomThought.id} from ${randomThought.section} to ${targetSection} at index ${targetIndex}`)
    
    try {
      // Simulate external API call to move a thought
      await api.patch<void>(
        routes.thoughtMove(String(randomThought.id)),
        { targetSection, targetIndex }
      )
      
      {
        console.log('✅ Move successful')
        // Refresh diagram to show the change
        await loadDiagramFromAPI()
        
        // AI notifies completion
        await fetch('/api/ai-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hasChanges: true,
            message: 'Thought moved successfully'
          })
        })
        
        setIsThinking(false)
        console.log('🤖 AI: "I\'ve moved that thought to a better location!"')
      }
    } catch (error) {
      console.error('❌ Error in simulated move:', getApiErrorMessage(error))
      setIsThinking(false)
    }
  }

  const simulateAIChanges = async () => {
    console.log('💬 User: "Analyze my diagram and suggest improvements"')
    setIsThinking(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    try {
      // Simulate AI analyzing current state and making multiple suggestions
      const changes = [
        {
          action: 'add',
          data: {
            content: `AI Analysis: Based on current status, I suggest implementing caching (${new Date().toLocaleTimeString()})`,
            section: 'analysis',
            aiGenerated: true,
            confidence: 0.78,
            tags: ['ai-analysis', 'caching'],
            priority: 'high'
          }
        },
        {
          action: 'add',
          data: {
            content: `AI Goal: Reduce response time to under 200ms (${new Date().toLocaleTimeString()})`,
            section: 'goal',
            aiGenerated: true,
            confidence: 0.89,
            tags: ['ai-goal', 'performance'],
            priority: 'high'
          }
        },
        {
          action: 'add',
          data: {
            content: `AI Action Plan: 1) Profile queries 2) Add indexes 3) Implement Redis cache (${new Date().toLocaleTimeString()})`,
            section: 'plan',
            aiGenerated: true,
            confidence: 0.95,
            tags: ['ai-plan', 'step-by-step'],
            priority: 'medium'
          }
        }
      ]

      // Execute changes sequentially to show AI "thinking"
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i]

        await api.post<ThoughtResponse>(routes.thoughts, change.data)
        
        // Small delay between AI actions to show progression
        await new Promise(resolve => setTimeout(resolve, 800))
      }
      
      // Final refresh to show all AI changes
      await loadDiagramFromAPI()
      
      // AI notifies completion
      await fetch('/api/ai-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasChanges: true,
          message: 'AI analysis complete with 3 new suggestions'
        })
      })
      
      setIsThinking(false)
      console.log('🤖 AI: "I\'ve analyzed your diagram and added 3 helpful suggestions!"')
      
    } catch (error) {
      console.error('❌ Error in AI simulation:', getApiErrorMessage(error))
      setIsThinking(false)
    }
  }

  // Item management functions
  const handleAddItem = async (section: GapsSection) => {
    console.log('🎯 ADD ITEM TRIGGERED for section:', section)
    
    try {
      // Call granular API to add thought
      const result = await api.post<ThoughtResponse>(
        routes.thoughts,
        { content: 'New thought', section }
      )
      console.log('✅ Created thought via API:', result.thought.id)
      
      // Add to local state with real database ID
      const newItem: GapsItem = {
        id: String(result.thought.id),
        text: result.thought.content,
        section: result.thought.section,
        order: result.thought.order,
        createdAt: new Date(result.thought.createdAt as any),
        updatedAt: new Date(result.thought.updatedAt as any)
      }
      
      setDiagram(prev => ({
        ...prev,
        items: [...prev.items, newItem].sort((a, b) => {
          // Sort by section first, then by order within section
          if (a.section !== b.section) {
            const sectionOrder = ['status', 'goal', 'analysis', 'plan']
            return sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section)
          }
          return a.order - b.order
        }),
        updatedAt: new Date(),
        version: prev.version + 1
      }))
      
      // Automatically start editing the new item
      setEditingItemId(newItem.id)
      setEditText('New thought')
    } catch (error) {
      console.error('❌ Error creating thought:', getApiErrorMessage(error))
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    console.log('🎯 REMOVE ITEM TRIGGERED for item:', itemId)
    
    try {
      // Call granular API to delete thought
      await api.del<void>(routes.thoughtById(String(itemId)))
      console.log('✅ Deleted thought via API:', itemId)
      
      // Update local state
      setDiagram(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
        updatedAt: new Date(),
        version: prev.version + 1
      }))
    } catch (error) {
      console.error('❌ Error deleting thought:', getApiErrorMessage(error))
    }
  }

  const handleStartEdit = (item: GapsItem) => {
    setEditingItemId(item.id)
    setEditText(item.text)
  }

  const handleSaveEdit = async (itemId: string) => {
    console.log('🎯 SAVE EDIT TRIGGERED for item:', itemId, 'with text:', editText)
    
    try {
      // Call granular API to update thought content
      const result = await api.put<ThoughtResponse>(
        routes.thoughtById(String(itemId)),
        { content: editText }
      )
        console.log('✅ Updated thought via API:', itemId)
        
        // Update local state
        setDiagram(prev => ({
          ...prev,
          items: prev.items.map(item => 
            item.id === itemId 
              ? { ...item, text: editText, updatedAt: new Date(result.thought.updatedAt as any) }
              : item
          ),
          updatedAt: new Date(),
          version: prev.version + 1
        }))
        
        setEditingItemId(null)
        setEditText('')
      
    } catch (error) {
      console.error('❌ Error updating thought:', getApiErrorMessage(error))
    }
  }

  const handleCancelEdit = () => {
    setEditingItemId(null)
    setEditText('')
  }

  // Title editing functions
  const handleStartMainTitleEdit = () => {
    setEditingMainTitle(true)
    setEditMainTitleText(diagram.title)
  }

  const handleStartMainTitleEditWithPosition = (e: React.MouseEvent) => {
    if (!titleSpanRef.current) {
      handleStartMainTitleEdit()
      return
    }

    const span = titleSpanRef.current
    const rect = span.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    
    // Create a temporary span to measure text width
    const tempSpan = document.createElement('span')
    tempSpan.style.font = window.getComputedStyle(span).font
    tempSpan.style.fontSize = window.getComputedStyle(span).fontSize
    tempSpan.style.fontFamily = window.getComputedStyle(span).fontFamily
    tempSpan.style.visibility = 'hidden'
    tempSpan.style.position = 'absolute'
    document.body.appendChild(tempSpan)

    let position = 0
    for (let i = 0; i <= diagram.title.length; i++) {
      tempSpan.textContent = diagram.title.slice(0, i)
      if (tempSpan.offsetWidth > clickX) {
        position = Math.max(0, i - 1)
        break
      }
      position = i
    }

    document.body.removeChild(tempSpan)
    setTitleClickPosition(position)
    setEditingMainTitle(true)
    setEditMainTitleText(diagram.title)
  }

  // Save current diagram state to database
  const saveDiagramToAPI = async (diagramToSave?: GapsDiagram) => {
    const timestamp = new Date().toLocaleTimeString()
    const saveId = Math.random().toString(36).substr(2, 9)
    
    try {
      const currentDiagram = diagramToSave || diagram
      console.log(`🚀 SAVE #${saveId} TRIGGERED at ${timestamp}: Saving diagram to database...`, currentDiagram.title)
      console.log(`🚀 SAVE #${saveId} Current diagram items count:`, currentDiagram.items.length)

      // Convert diagram format to API format
      const apiData = {
        title: currentDiagram.title,
        status: getItemsBySection(currentDiagram.items, 'status').map(item => item.text),
        goal: getItemsBySection(currentDiagram.items, 'goal').map(item => item.text),
        analysis: getItemsBySection(currentDiagram.items, 'analysis').map(item => item.text),
        plan: getItemsBySection(currentDiagram.items, 'plan').map(item => item.text)
      }

      console.log(`🚀 SAVE #${saveId} API Data being sent:`, apiData)

      await api.put<void>(routes.diagram, apiData)

      {
        console.log(`✅ SAVE #${saveId} Successfully saved to database`)
      }
    } catch (error) {
      console.error(`❌ SAVE #${saveId} Error saving to database:`, error)
    }
  }

  const handleSaveMainTitleEdit = () => {
    const updatedDiagram = {
      ...diagram,
      title: editMainTitleText,
      updatedAt: new Date(),
      version: diagram.version + 1
    }
    setDiagram(updatedDiagram)
    setEditingMainTitle(false)
    setEditMainTitleText('')
    
    // Save to database
    setTimeout(() => saveDiagramToAPI(updatedDiagram), 100)
  }

  const handleCancelMainTitleEdit = () => {
    setEditingMainTitle(false)
    setEditMainTitleText('')
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: GapsItem) => {
    const sectionItems = getItemsBySection(diagram.items, item.section)
    const sourceIndex = sectionItems.findIndex(sectionItem => sectionItem.id === item.id)
    
    const dragData: DragData = {
      itemId: item.id,
      sourceSection: item.section,
      sourceIndex
    }
    
    setIsDragging(true) // Set dragging state
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleItemDragOver = (e: React.DragEvent, section: GapsSection, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDropIndicator({ section, index })
  }

  const handleItemDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropIndicator(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetSection: GapsSection) => {
    console.log('🎯 HANDLE_DROP TRIGGERED to section:', targetSection)
    e.preventDefault()
    setDropIndicator(null)
    setIsDragging(false) // Reset dragging state
    
    const dragDataText = e.dataTransfer.getData('text/plain')
    if (!dragDataText) return
    
    try {
      const dragData: DragData = JSON.parse(dragDataText)
      const draggedItem = diagram.items.find(item => item.id === dragData.itemId)
      if (!draggedItem) return
      
      const targetSectionItems = getItemsBySection(diagram.items, targetSection)
      
      const updatedDiagram = {
        ...diagram,
        items: diagram.items.map(item => 
          item.id === dragData.itemId
            ? { ...item, section: targetSection, order: targetSectionItems.length, updatedAt: new Date() }
            : item
        ),
        updatedAt: new Date(),
        version: diagram.version + 1
      }
      setDiagram(updatedDiagram)
      
      // Save removed from handleDrop - handleItemDrop handles saves
      console.log('handleDrop: State updated, save delegated to handleItemDrop')
    } catch (error) {
      console.error('Error parsing drag data:', getApiErrorMessage(error))
    }
  }

  const handleItemDrop = async (e: React.DragEvent, targetSection: GapsSection, targetIndex: number) => {
    console.log('🎯 HANDLE_ITEM_DROP TRIGGERED to section:', targetSection, 'index:', targetIndex)
    e.preventDefault()
    e.stopPropagation()
    setDropIndicator(null)
    setIsDragging(false) // Reset dragging state
    
    const dragDataText = e.dataTransfer.getData('text/plain')
    if (!dragDataText) return
    
    try {
      const dragData: DragData = JSON.parse(dragDataText)
      const draggedItem = diagram.items.find(item => item.id === dragData.itemId)
      if (!draggedItem) return
      
      if (dragData.sourceSection === targetSection && dragData.sourceIndex === targetIndex) {
        return // No change needed
      }
      
      setDiagram(prev => {
        let newItems = [...prev.items]
        
        if (dragData.sourceSection === targetSection) {
          // Reordering within same section
          const sectionItems = getItemsBySection(newItems, targetSection)
          const adjustedTargetIndex = dragData.sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
          
          // Update orders for items in the section
          sectionItems.forEach((item, index) => {
            const actualItem = newItems.find(i => i.id === item.id)!
            if (item.id === dragData.itemId) {
              actualItem.order = adjustedTargetIndex
            } else if (index >= Math.min(dragData.sourceIndex, adjustedTargetIndex) && 
                      index <= Math.max(dragData.sourceIndex, adjustedTargetIndex)) {
              if (dragData.sourceIndex < adjustedTargetIndex) {
                actualItem.order = index - 1
              } else {
                actualItem.order = index + 1
              }
            }
          })
        } else {
          // Moving between sections
          newItems = newItems.map(item => {
            if (item.id === dragData.itemId) {
              return { ...item, section: targetSection, order: targetIndex, updatedAt: new Date() }
            }
            // Adjust orders for other items in target section
            if (item.section === targetSection && item.order >= targetIndex) {
              return { ...item, order: item.order + 1 }
            }
            // Adjust orders for items in source section
            if (item.section === dragData.sourceSection && item.order > dragData.sourceIndex) {
              return { ...item, order: item.order - 1 }
            }
            return item
          })
        }
        
        return {
          ...prev,
          items: newItems,
          updatedAt: new Date(),
          version: prev.version + 1
        }
      })
      
      // Call granular API to move thought
      try {
        await api.patch<void>(routes.thoughtMove(String(dragData.itemId)), {
          targetSection: targetSection, 
          targetIndex: targetIndex 
        })
        console.log('✅ Moved thought via API:', dragData.itemId)
      } catch (error) {
        console.error('❌ Error moving thought:', getApiErrorMessage(error))
      }
    } catch (error) {
      console.error('Error parsing drag data:', getApiErrorMessage(error))
    }
  }

  // Manual test functions for debugging
  const testSave = () => {
    console.log('Saving entire diagram to database (manual test)')
    saveDiagramToAPI()
  }

  const testLoad = () => {
    console.log('🧪 MANUAL LOAD: Loading diagram from database')
    loadDiagramFromAPI()
  }

  const testTitleUpdateAPI = async () => {
    console.log('🎯 Testing title update API...')
    try {
      const data = await api.put<{ success: boolean; message: string; diagram: DiagramApi }>(
        routes.diagramTitle,
        { title: 'AI Updated Title 🚀' }
      )
      console.log('✅ Title update API successful:', data)
      // Reload the diagram to show the updated title
      await loadDiagramFromAPI()
    } catch (error) {
      console.error('❌ Error testing title update API:', getApiErrorMessage(error))
    }
  }

  // Master orchestrator to run all debug actions sequentially
  const runAllDebugTests = async () => {
    console.log('🚀 Run All Tests: start')
    try {
      // 1) Load + Save current diagram
      await loadDiagramFromAPI()
      await saveDiagramToAPI()

      // 2) Deterministic CRUD on a single item
      let createdId: string | null = null
      // Create
      {
        const resp = await fetch('/api/thoughts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'RunAll: seed thought', section: 'status' })
        })
        if (resp.ok) {
          const json = await resp.json()
          createdId = String(json?.thought?.id ?? '')
          await loadDiagramFromAPI()
        }
      }
      // Edit
      if (createdId) {
        await fetch(`/api/thoughts/${createdId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'RunAll: edited thought' })
        })
        await loadDiagramFromAPI()
      }
      // Move
      if (createdId) {
        await fetch(`/api/thoughts/${createdId}/move`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetSection: 'analysis', targetIndex: 0 })
        })
        await loadDiagramFromAPI()
      }
      // Delete
      if (createdId) {
        await fetch(`/api/thoughts/${createdId}`, { method: 'DELETE' })
        await loadDiagramFromAPI()
      }

      // 3) Seed bulk test data
      await sendTestDataToAPI()
      await loadDiagramFromAPI()

      // 4) AI style flows
      await simulateAIChanges()
      await testTitleUpdateAPI()
      await simulateAIBulkUpdate()
      await simulateAIRapidFire()

      console.log('✅ Run All Tests: complete')
    } catch (error) {
      console.error('❌ Run All Tests failed:', getApiErrorMessage(error))
    }
  }

  // AI Simulation - Bulk Update (simulates real chat flow)
  const simulateAIBulkUpdate = async () => {
    console.log('🤖 AI BULK: Simulating user chat -> AI response flow')
    
    // Step 1: User sends message (show thinking overlay)
    setIsThinking(true)
    console.log('💬 User: "Please update my diagram with performance improvements"')
    
    // Step 2: AI processes (simulate thinking time)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const aiDiagramData = {
      title: "AI Enhanced Diagram",
      status: [
        "Current system performance baseline established",
        "User feedback collected and analyzed"
      ],
      goal: [
        "Improve response time by 50%",
        "Increase user satisfaction to 95%",
        "Reduce error rate to < 0.1%"
      ],
      analysis: [
        "Bottleneck identified in database queries",
        "Frontend rendering inefficiencies detected",
        "High memory usage in background processes"
      ],
      plan: [
        "Implement database indexing strategy",
        "Optimize React component rendering",
        "Refactor background job processing",
        "Deploy caching layer",
        "Monitor performance metrics"
      ]
    }

    try {
      // Step 3: AI makes database changes
      const response = await fetch('/api/diagram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiDiagramData)
      })

      if (response.ok) {
        console.log('✅ AI bulk update successful')
        
        // Step 4: AI notifies frontend it's done
        await fetch('/api/ai-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hasChanges: true,
            message: 'AI has updated your diagram with performance improvements'
          })
        })
        
        // Step 5: Frontend updates and removes thinking overlay
        setIsThinking(false)
        await loadDiagramFromAPI()
        console.log('🤖 AI: "I\'ve updated your diagram with performance improvements!"')
      } else {
        console.error('❌ AI bulk update failed')
        setIsThinking(false)
      }
    } catch (error) {
      console.error('❌ Error in AI bulk update:', getApiErrorMessage(error))
      setIsThinking(false)
    }
  }

  // AI Simulation - Rapid Fire (simulates real chat flow with multiple changes)
  const simulateAIRapidFire = async () => {
    console.log('🤖 AI RAPID: Simulating user chat -> AI makes multiple changes')
    
    // Step 1: User sends message (show thinking overlay)
    setIsThinking(true)
    console.log('💬 User: "Please analyze my diagram and suggest improvements"')
    
    // Step 2: AI processes (simulate thinking time)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const operations = [] as Promise<unknown>[]
    
    // Add multiple thoughts rapidly
    operations.push(
      api.post<ThoughtResponse>(routes.thoughts, {
        content: 'AI Added: Critical security vulnerability',
        section: 'status',
        priority: 'high',
        tags: ['security', 'urgent'],
      })
    )
    
    operations.push(
      api.post<ThoughtResponse>(routes.thoughts, {
        content: 'AI Added: Implement zero-trust architecture',
        section: 'plan',
        priority: 'high',
        tags: ['security', 'architecture'],
      })
    )

    // If we have existing thoughts, try to edit and move them
    // Fetch fresh data to avoid stale IDs after prior bulk updates
    let firstItem: GapsItem | null = null
    let lastItem: GapsItem | null = null
    try {
      const json: DiagramApi = await api.get<DiagramApi>(routes.diagram)
      const thoughts = Array.isArray(json?.thoughts) ? json.thoughts : []
      if (thoughts.length > 0) {
        const t0 = thoughts[0]
        firstItem = {
          id: String(t0?.id ?? generateId()),
          text: String(t0?.text ?? ''),
          section: (t0?.section ?? 'status') as GapsSection,
          order: Number(t0?.order ?? 0),
          createdAt: new Date(t0?.createdAt ?? Date.now()),
          updatedAt: new Date(t0?.updatedAt ?? Date.now()),
        }
        const last = thoughts[thoughts.length - 1]
        lastItem = {
          id: String(last?.id ?? generateId()),
          text: String(last?.text ?? ''),
          section: (last?.section ?? 'status') as GapsSection,
          order: Number(last?.order ?? 0),
          createdAt: new Date(last?.createdAt ?? Date.now()),
          updatedAt: new Date(last?.updatedAt ?? Date.now()),
        }
      }
    } catch {}
    if (firstItem && lastItem) {
      
      // Edit an existing thought
      operations.push(
        api.put<ThoughtResponse>(routes.thoughtById(String(firstItem.id)), { content: `${firstItem.text} (AI Enhanced)` })
      )
      
      // Move a thought to a different section
      if (lastItem.section !== 'analysis') {
        operations.push(
          api.patch<void>(routes.thoughtMove(String(lastItem.id)), { targetSection: 'analysis', targetIndex: 0 })
        )
      }
    }

    try {
      // Step 3: AI makes multiple database changes
      console.log(`🔥 AI making ${operations.length} simultaneous changes...`)
      const results = await Promise.all(operations)
      console.log('✅ AI rapid fire completed:', results.length, 'operations')
      
      // Step 4: AI notifies frontend it's done
      await fetch('/api/ai-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasChanges: true,
          message: `AI has made ${results.length} improvements to your diagram`
        })
      })
      
      // Step 5: Frontend updates and removes thinking overlay
      setIsThinking(false)
      await loadDiagramFromAPI()
      console.log('🤖 AI: "I\'ve analyzed your diagram and made several improvements!"')
      
    } catch (error) {
      console.error('❌ Error in AI rapid fire:', getApiErrorMessage(error))
      setIsThinking(false)
    }
  }

  // Calculate dynamic buffer zone height based on item count
  const getBufferHeight = (itemCount: number): string => {
    if (itemCount === 0) return 'h-16' // Empty section needs space to show it can receive items
    if (itemCount <= 2) return 'h-12' // Small sections get moderate buffer
    if (itemCount <= 4) return 'h-8'  // Medium sections get smaller buffer  
    return 'h-4' // Full sections get minimal buffer
  }

  const sections: GapsSection[] = ['status', 'goal', 'analysis', 'plan']

  return (
    <div className="p-5 bg-gray-50 min-h-screen relative">
      {/* Thinking Overlay */}
      {isThinking && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-lg font-semibold text-gray-800">Working...</div>
            </div>
            <div className="mt-2 text-sm text-gray-600">Please wait while I process your request</div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Main Content: GAPS Diagram */}
        <div className="flex-1">
        {/* GAPS Diagram Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 pb-3">

          <div className="text-center mb-4">
            {editingMainTitle ? (
              <input
                ref={titleInputRef}
                value={editMainTitleText}
                onChange={(e) => setEditMainTitleText(e.target.value)}
                onBlur={handleSaveMainTitleEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveMainTitleEdit()
                  if (e.key === 'Escape') handleCancelMainTitleEdit()
                }}
                autoFocus
                className="text-2xl font-bold text-center bg-transparent border-none outline-none w-full text-gray-900"
              />
            ) : (
              <h1 
                ref={titleSpanRef}
                className={`text-2xl font-bold cursor-text ${diagram.title ? 'text-gray-900' : 'text-gray-400'}`}
                onClick={handleStartMainTitleEditWithPosition}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleStartMainTitleEdit()
                }}
                tabIndex={0}
                role="button"
                aria-label="Click to edit diagram title"
              >
                {diagram.title || 'Add title here...'}
              </h1>
            )}
          </div>

          {/* GAPS Grid - Clean Four Boxes */}
          <div className={`grid grid-cols-2 gap-4 min-h-[400px] ${isThinking ? 'pointer-events-none opacity-50' : ''}`}>
            {/* Status Quadrant (Top Left) */}
            <div 
              className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200 relative"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'status')}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                <button 
                  onClick={() => handleAddItem('status')}
                  className="w-6 h-6 rounded-full border border-gray-300 bg-gray-600 text-white text-sm font-bold hover:scale-110 transition-transform hover:bg-gray-700"
                  aria-label="Add item to Status"
                >
                  +
                </button>
              </div>
              <div className="space-y-2">
                {getItemsBySection(diagram.items, 'status').map((item, index) => {
                  const showDropIndicator = dropIndicator?.section === 'status' && dropIndicator?.index === index
                  
                  return (
                    <div key={item.id} className="relative">
                      {showDropIndicator && (
                        <div className="absolute -top-1 left-0 right-0 h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse z-10" />
                      )}
                      
                      <GapsItemComponent
                        item={item}
                        isEditing={editingItemId === item.id}
                        editText={editText}
                        onStartEdit={() => handleStartEdit(item)}
                        onSaveEdit={() => handleSaveEdit(item.id)}
                        onCancelEdit={handleCancelEdit}
                        onEditTextChange={setEditText}
                        onRemove={() => handleRemoveItem(item.id)}
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleItemDragOver(e, 'status', index)}
                        onDragLeave={handleItemDragLeave}
                        onDrop={(e) => handleItemDrop(e, 'status', index)}
                      />
                    </div>
                  )
                })}
                
                <div
                  className={`${getBufferHeight(getItemsBySection(diagram.items, 'status').length)} opacity-0 relative`}
                  onDragOver={(e) => handleItemDragOver(e, 'status', getItemsBySection(diagram.items, 'status').length)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e) => handleItemDrop(e, 'status', getItemsBySection(diagram.items, 'status').length)}
                >
                  {dropIndicator?.section === 'status' && dropIndicator?.index === getItemsBySection(diagram.items, 'status').length && (
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse z-10" />
                  )}
                </div>
              </div>
            </div>

            {/* Goal Quadrant (Top Right) */}
            <div 
              className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200 relative"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'goal')}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Goal</h3>
                <button 
                  onClick={() => handleAddItem('goal')}
                  className="w-6 h-6 rounded-full border border-gray-300 bg-gray-600 text-white text-sm font-bold hover:scale-110 transition-transform hover:bg-gray-700"
                  aria-label="Add item to Goal"
                >
                  +
                </button>
              </div>
              <div className="space-y-2">
                {getItemsBySection(diagram.items, 'goal').map((item, index) => {
                  const showDropIndicator = dropIndicator?.section === 'goal' && dropIndicator?.index === index
                  
                  return (
                    <div key={item.id} className="relative">
                      {showDropIndicator && (
                        <div className="absolute -top-1 left-0 right-0 h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse z-10" />
                      )}
                      
                      <GapsItemComponent
                        item={item}
                        isEditing={editingItemId === item.id}
                        editText={editText}
                        onStartEdit={() => handleStartEdit(item)}
                        onSaveEdit={() => handleSaveEdit(item.id)}
                        onCancelEdit={handleCancelEdit}
                        onEditTextChange={setEditText}
                        onRemove={() => handleRemoveItem(item.id)}
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleItemDragOver(e, 'goal', index)}
                        onDragLeave={handleItemDragLeave}
                        onDrop={(e) => handleItemDrop(e, 'goal', index)}
                      />
                    </div>
                  )
                })}
                
                <div
                  className={`${getBufferHeight(getItemsBySection(diagram.items, 'goal').length)} opacity-0 relative`}
                  onDragOver={(e) => handleItemDragOver(e, 'goal', getItemsBySection(diagram.items, 'goal').length)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e) => handleItemDrop(e, 'goal', getItemsBySection(diagram.items, 'goal').length)}
                >
                  {dropIndicator?.section === 'goal' && dropIndicator?.index === getItemsBySection(diagram.items, 'goal').length && (
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse z-10" />
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Quadrant (Bottom Left) */}
            <div 
              className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200 relative"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'analysis')}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Analysis</h3>
                <button 
                  onClick={() => handleAddItem('analysis')}
                  className="w-6 h-6 rounded-full border border-gray-300 bg-gray-600 text-white text-sm font-bold hover:scale-110 transition-transform hover:bg-gray-700"
                  aria-label="Add item to Analysis"
                >
                  +
                </button>
              </div>
              <div className="space-y-2">
                {getItemsBySection(diagram.items, 'analysis').map((item, index) => {
                  const showDropIndicator = dropIndicator?.section === 'analysis' && dropIndicator?.index === index
                  
                  return (
                    <div key={item.id} className="relative">
                      {showDropIndicator && (
                        <div className="absolute -top-1 left-0 right-0 h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse z-10" />
                      )}
                      
                      <GapsItemComponent
                        item={item}
                        isEditing={editingItemId === item.id}
                        editText={editText}
                        onStartEdit={() => handleStartEdit(item)}
                        onSaveEdit={() => handleSaveEdit(item.id)}
                        onCancelEdit={handleCancelEdit}
                        onEditTextChange={setEditText}
                        onRemove={() => handleRemoveItem(item.id)}
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleItemDragOver(e, 'analysis', index)}
                        onDragLeave={handleItemDragLeave}
                        onDrop={(e) => handleItemDrop(e, 'analysis', index)}
                      />
                    </div>
                  )
                })}
                
                <div
                  className={`${getBufferHeight(getItemsBySection(diagram.items, 'analysis').length)} opacity-0 relative`}
                  onDragOver={(e) => handleItemDragOver(e, 'analysis', getItemsBySection(diagram.items, 'analysis').length)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e) => handleItemDrop(e, 'analysis', getItemsBySection(diagram.items, 'analysis').length)}
                >
                  {dropIndicator?.section === 'analysis' && dropIndicator?.index === getItemsBySection(diagram.items, 'analysis').length && (
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse z-10" />
                  )}
                </div>
              </div>
            </div>

            {/* Plan Quadrant (Bottom Right) */}
            <div 
              className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200 relative"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'plan')}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Plan</h3>
                <button 
                  onClick={() => handleAddItem('plan')}
                  className="w-6 h-6 rounded-full border border-gray-300 bg-gray-600 text-white text-sm font-bold hover:scale-110 transition-transform hover:bg-gray-700"
                  aria-label="Add item to Plan"
                >
                  +
                </button>
              </div>
              <div className="space-y-2">
                {getItemsBySection(diagram.items, 'plan').map((item, index) => {
                  const showDropIndicator = dropIndicator?.section === 'plan' && dropIndicator?.index === index
                  
                  return (
                    <div key={item.id} className="relative">
                      {showDropIndicator && (
                        <div className="absolute -top-1 left-0 right-0 h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse z-10" />
                      )}
                      
                      <GapsItemComponent
                        item={item}
                        isEditing={editingItemId === item.id}
                        editText={editText}
                        onStartEdit={() => handleStartEdit(item)}
                        onSaveEdit={() => handleSaveEdit(item.id)}
                        onCancelEdit={handleCancelEdit}
                        onEditTextChange={setEditText}
                        onRemove={() => handleRemoveItem(item.id)}
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleItemDragOver(e, 'plan', index)}
                        onDragLeave={handleItemDragLeave}
                        onDrop={(e) => handleItemDrop(e, 'plan', index)}
                      />
                    </div>
                  )
                })}
                
                <div
                  className={`${getBufferHeight(getItemsBySection(diagram.items, 'plan').length)} opacity-0 relative`}
                  onDragOver={(e) => handleItemDragOver(e, 'plan', getItemsBySection(diagram.items, 'plan').length)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e) => handleItemDrop(e, 'plan', getItemsBySection(diagram.items, 'plan').length)}
                >
                  {dropIndicator?.section === 'plan' && dropIndicator?.index === getItemsBySection(diagram.items, 'plan').length && (
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse z-10" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        
        {/* Debugging Panel */}
        <div className="w-96 bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 Debugging</h2>
          <div className="mb-4">
            <button
              onClick={runAllDebugTests}
              className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-left"
              title="Run all debug panel tests sequentially"
            >
              🚀 Run All Tests
            </button>
          </div>
          
          {/* Breadcrumbs Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Diagram Info</h3>
            <div className="space-y-1 text-sm text-gray-600 font-mono">
              <div><span className="font-sans text-gray-500">Board ID:</span> {diagram.id || 'Loading...'}</div>
              <div><span className="font-sans text-gray-500">Title:</span> {diagram.title || 'Untitled'}</div>
              <div><span className="font-sans text-gray-500">User:</span> Default User</div>
              <div><span className="font-sans text-gray-500">Total Items:</span> {diagram.items.length}</div>
              <div className="pt-1">
                <div><span className="font-sans text-gray-500">Sections:</span></div>
                <div className="ml-2 space-y-1">
                  <div>• Status: {getItemsBySection(diagram.items, 'status').length}</div>
                  <div>• Goal: {getItemsBySection(diagram.items, 'goal').length}</div>
                  <div>• Analysis: {getItemsBySection(diagram.items, 'analysis').length}</div>
                  <div>• Plan: {getItemsBySection(diagram.items, 'plan').length}</div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div><span className="font-sans text-gray-500">Database Status:</span> <span className="text-green-600">Connected</span></div>
              </div>
            </div>
          </div>
          
          {/* Database Operations */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Database</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={testLoad}
                className="px-2 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-left border border-blue-200"
                title="Load current diagram from database"
              >
                📥 Load
              </button>
              <button
                onClick={testSave}
                className="px-2 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-left border border-green-200"
                title="Save entire diagram to database (bulk update)"
              >
                💾 Save
              </button>
              <button
                onClick={sendTestDataToAPI}
                className="px-2 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors text-left border border-purple-200 col-span-2"
                title="Send test data to API"
              >
                🧪 Test Data
              </button>
            </div>
          </div>

          {/* API Simulations */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">API Simulations</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={simulateAddThought}
                className="px-2 py-2 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors text-left border border-orange-200"
                title="Simulate external API call to add a thought"
              >
                ➕ Add
              </button>
              <button
                onClick={simulateEditThought}
                className="px-2 py-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors text-left border border-yellow-200"
                title="Simulate external API call to edit a thought"
              >
                ✏️ Edit
              </button>
              <button
                onClick={simulateDeleteThought}
                className="px-2 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-left border border-red-200"
                title="Simulate external API call to delete a thought"
              >
                🗑️ Delete
              </button>
              <button
                onClick={simulateMoveThought}
                className="px-2 py-2 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-left border border-indigo-200"
                title="Simulate external API call to move a thought between sections"
              >
                🔄 Move
              </button>
              <button
                onClick={simulateAIChanges}
                className="px-2 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-left border border-gray-200 col-span-2"
                title="Simulate AI making multiple changes via API"
              >
                🤖 AI Sim
              </button>
              <button
                onClick={testTitleUpdateAPI}
                className="px-2 py-2 text-sm bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors text-left border border-teal-200 col-span-2"
                title="Test the new title update API endpoint"
              >
                🎯 Test Title API
              </button>
            </div>
          </div>

          {/* Advanced AI Simulations */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Advanced AI Tests</h4>
            <div className="space-y-2">
              <button
                onClick={simulateAIBulkUpdate}
                className="w-full px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors text-left border border-purple-200"
                title="Simulate AI updating entire diagram at once"
              >
                🧠 AI Bulk Update
              </button>
              <button
                onClick={simulateAIRapidFire}
                className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-left border border-red-200"
                title="Simulate AI making rapid simultaneous API calls"
              >
                ⚡ AI Rapid Fire
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 