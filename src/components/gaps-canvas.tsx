'use client'

import React, { useState } from 'react'
import { GapsSection, GapsItem, GapsDiagram } from '@/lib/types'
import { 
  createDefaultDiagram, 
  createGapsItem, 
  getItemsBySection, 
  getSectionColors,
  getSectionDisplayName,
  generateId 
} from '@/lib/utils'
import { GapsBox } from './gaps-box'
import { GapsItemComponent } from './gaps-item'

interface DragData {
  itemId: string
  sourceSection: GapsSection
  sourceIndex: number
}

interface DropIndicator {
  section: GapsSection
  index: number
}

export const GapsCanvas = () => {
  // Initialize with empty diagram - will load from API
  const [diagram, setDiagram] = useState<GapsDiagram>(() => {
    const initialDiagram = createDefaultDiagram()
    initialDiagram.title = "GAPS Diagram"
    initialDiagram.items = []
    return initialDiagram
  })

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)
  const [editingMainTitle, setEditingMainTitle] = useState(false)
  const [editMainTitleText, setEditMainTitleText] = useState('')
  const [titleClickPosition, setTitleClickPosition] = useState<number | null>(null)

  const titleInputRef = React.useRef<HTMLInputElement>(null)
  const titleSpanRef = React.useRef<HTMLHeadingElement>(null)

  // Load initial data from API
  const loadDiagramFromAPI = async () => {
    try {
      console.log('🎯 Loading diagram from /api/diagram...')
      // Use relative path - works in any environment (localhost, staging, production)
      const response = await fetch('/api/diagram')
      console.log('🎯 Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🎯 API response data:', JSON.stringify(data, null, 2))
        
        // Convert API response to diagram format
        const items: GapsItem[] = []
        let idCounter = 1

        // Add status items
        data.status?.forEach((text: string, index: number) => {
          items.push({
            id: `status-${idCounter++}`,
            text,
            section: 'status',
            order: index,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        })

        // Add goal items
        data.goal?.forEach((text: string, index: number) => {
          items.push({
            id: `goal-${idCounter++}`,
            text,
            section: 'goal',
            order: index,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        })

        // Add analysis items
        data.analysis?.forEach((text: string, index: number) => {
          items.push({
            id: `analysis-${idCounter++}`,
            text,
            section: 'analysis',
            order: index,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        })

        // Add plan items
        data.plan?.forEach((text: string, index: number) => {
          items.push({
            id: `plan-${idCounter++}`,
            text,
            section: 'plan',
            order: index,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        })

        console.log('🎯 Converted to', items.length, 'items:', items.map(i => `${i.section}: ${i.text}`))

        setDiagram(prev => ({
          ...prev,
          title: data.title || '',
          items,
          updatedAt: new Date()
        }))
        
        console.log('🎯 Diagram state updated!')
      } else {
        console.log('🎯 Response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('🎯 Failed to load diagram from API:', error)
    }
  }

  // Test function to send sample data to API
  const sendTestDataToAPI = async () => {
    try {
      console.log('🧪 Sending test data to API...')
      
      const testData = {
        title: 'Test Data from Frontend',
        status: ['Status item 1', 'Status item 2'],
        goal: ['Goal item 1', 'Goal item 2'], 
        analysis: ['Analysis item 1', 'Analysis item 2'],
        plan: ['Plan item 1', 'Plan item 2']
      }
      
      const response = await fetch('/api/diagram', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })
      
      console.log('🧪 PUT Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('🧪 PUT Response:', JSON.stringify(result, null, 2))
        
        // Reload data from API to see if it persisted
        console.log('🧪 Reloading data to check persistence...')
        await loadDiagramFromAPI()
      } else {
        console.error('🧪 PUT request failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('🧪 Error sending test data:', error)
    }
  }

  // Load data on component mount only (no polling)
  React.useEffect(() => {
    loadDiagramFromAPI()
  }, [])

  // Item management functions
  const handleAddItem = (section: GapsSection) => {
    const newItem = createGapsItem('', section)
    const sectionItems = getItemsBySection(diagram.items, section)
    newItem.order = sectionItems.length
    
    setDiagram(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      updatedAt: new Date(),
      version: prev.version + 1
    }))
    
    // Automatically start editing the new item
    setEditingItemId(newItem.id)
    setEditText('')
  }

  const handleRemoveItem = (itemId: string) => {
    setDiagram(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
      updatedAt: new Date(),
      version: prev.version + 1
    }))
  }

  const handleStartEdit = (item: GapsItem) => {
    setEditingItemId(item.id)
    setEditText(item.text)
  }

  const handleSaveEdit = (itemId: string) => {
    setDiagram(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, text: editText, updatedAt: new Date() }
          : item
      ),
      updatedAt: new Date(),
      version: prev.version + 1
    }))
    setEditingItemId(null)
    setEditText('')
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

  const handleSaveMainTitleEdit = () => {
    setDiagram(prev => ({
      ...prev,
      title: editMainTitleText,
      updatedAt: new Date(),
      version: prev.version + 1
    }))
    setEditingMainTitle(false)
    setEditMainTitleText('')
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
    e.preventDefault()
    setDropIndicator(null)
    
    const dragDataText = e.dataTransfer.getData('text/plain')
    if (!dragDataText) return
    
    try {
      const dragData: DragData = JSON.parse(dragDataText)
      const draggedItem = diagram.items.find(item => item.id === dragData.itemId)
      if (!draggedItem) return
      
      const targetSectionItems = getItemsBySection(diagram.items, targetSection)
      
      setDiagram(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === dragData.itemId
            ? { ...item, section: targetSection, order: targetSectionItems.length, updatedAt: new Date() }
            : item
        ),
        updatedAt: new Date(),
        version: prev.version + 1
      }))
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }

  const handleItemDrop = (e: React.DragEvent, targetSection: GapsSection, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDropIndicator(null)
    
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
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }

  const sections: GapsSection[] = ['status', 'goal', 'analysis', 'plan']

  return (
    <div className="p-5 bg-gray-50 min-h-screen">
      {/* Main Content: Chat + GAPS Diagram */}
      <div className="flex gap-8 max-w-7xl mx-auto">
        {/* Chat Section */}
        <div className="w-1/3">
          <iframe 
            src="https://gapscoachv2-72392.chipp.ai" 
            height="700px" 
            width="100%" 
            frameBorder="0" 
            title="GAPS Coach V2"
            className="rounded-lg shadow-lg"
          />
        </div>

        {/* GAPS Diagram Section */}
        <div className="w-2/3 bg-white rounded-lg shadow-lg p-6 pb-3">
          {/* Title Section - Centered above diagram only */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button
                onClick={loadDiagramFromAPI}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="Refresh from API"
              >
                🔄 Refresh
              </button>
              <button
                onClick={sendTestDataToAPI}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                title="Send test data to API"
              >
                🧪 Test Data
              </button>
            </div>
            <div className="flex-1"></div>
          </div>
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
          <div className="grid grid-cols-2 gap-4 min-h-[600px]">
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
                    <div key={item.id}>
                      {showDropIndicator && (
                        <div className="h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse mb-1" />
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
                
                {dropIndicator?.section === 'status' && dropIndicator?.index === getItemsBySection(diagram.items, 'status').length && (
                  <div className="h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse" />
                )}
                
                <div
                  className="h-16 opacity-0"
                  onDragOver={(e) => handleItemDragOver(e, 'status', getItemsBySection(diagram.items, 'status').length)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e) => handleItemDrop(e, 'status', getItemsBySection(diagram.items, 'status').length)}
                />
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
                    <div key={item.id}>
                      {showDropIndicator && (
                        <div className="h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse mb-1" />
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
                
                {dropIndicator?.section === 'goal' && dropIndicator?.index === getItemsBySection(diagram.items, 'goal').length && (
                  <div className="h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse" />
                )}
                
                <div
                  className="h-16 opacity-0"
                  onDragOver={(e) => handleItemDragOver(e, 'goal', getItemsBySection(diagram.items, 'goal').length)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e) => handleItemDrop(e, 'goal', getItemsBySection(diagram.items, 'goal').length)}
                />
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
                    <div key={item.id}>
                      {showDropIndicator && (
                        <div className="h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse mb-1" />
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
                
                {dropIndicator?.section === 'analysis' && dropIndicator?.index === getItemsBySection(diagram.items, 'analysis').length && (
                  <div className="h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse" />
                )}
                
                <div
                  className="h-4 opacity-0"
                  onDragOver={(e) => handleItemDragOver(e, 'analysis', getItemsBySection(diagram.items, 'analysis').length)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e) => handleItemDrop(e, 'analysis', getItemsBySection(diagram.items, 'analysis').length)}
                />
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
                    <div key={item.id}>
                      {showDropIndicator && (
                        <div className="h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse mb-1" />
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
                
                {dropIndicator?.section === 'plan' && dropIndicator?.index === getItemsBySection(diagram.items, 'plan').length && (
                  <div className="h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse" />
                )}
                
                <div
                  className="h-4 opacity-0"
                  onDragOver={(e) => handleItemDragOver(e, 'plan', getItemsBySection(diagram.items, 'plan').length)}
                  onDragLeave={handleItemDragLeave}
                  onDrop={(e) => handleItemDrop(e, 'plan', getItemsBySection(diagram.items, 'plan').length)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 