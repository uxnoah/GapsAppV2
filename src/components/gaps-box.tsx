'use client'

import React from 'react'
import { GapsSection, GapsItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { GapsItemComponent } from './gaps-item'

interface DropIndicator {
  section: GapsSection
  index: number
}

interface GapsBoxProps {
  section: GapsSection
  title: string
  items: GapsItem[]
  colors: {
    bg: string
    border: string
    text: string
    hover: string
  }
  editingItemId: string | null
  editText: string
  dropIndicator: DropIndicator | null
  onAddItem: () => void
  onRemoveItem: (itemId: string) => void
  onStartEdit: (item: GapsItem) => void
  onSaveEdit: (itemId: string) => void
  onCancelEdit: () => void
  onEditTextChange: (text: string) => void
  onDragStart: (e: React.DragEvent, item: GapsItem) => void
  onDragOver: (e: React.DragEvent) => void
  onItemDragOver: (e: React.DragEvent, section: GapsSection, index: number) => void
  onItemDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onItemDrop: (e: React.DragEvent, index: number) => void
}

export const GapsBox: React.FC<GapsBoxProps> = ({
  section,
  title,
  items,
  colors,
  editingItemId,
  editText,
  dropIndicator,
  onAddItem,
  onRemoveItem,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
  onDragStart,
  onDragOver,
  onItemDragOver,
  onItemDragLeave,
  onDrop,
  onItemDrop
}) => {
  return (
    <div 
      className={cn(
        'border-2 rounded-xl p-4 min-h-[200px] transition-colors',
        colors.bg,
        colors.border
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
        <button 
          onClick={onAddItem}
          className="w-6 h-6 rounded-full border border-gray-300 bg-gray-600 text-white text-sm font-bold hover:scale-110 transition-transform hover:bg-gray-700"
          aria-label={`Add item to ${title}`}
        >
          +
        </button>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const showDropIndicator = dropIndicator?.section === section && dropIndicator?.index === index
          
          return (
            <div key={item.id}>
              {/* Drop Indicator */}
              {showDropIndicator && (
                <div className="h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse mb-1" />
              )}
              
              {/* Item Component */}
              <GapsItemComponent
                item={item}
                isEditing={editingItemId === item.id}
                editText={editText}
                onStartEdit={() => onStartEdit(item)}
                onSaveEdit={() => onSaveEdit(item.id)}
                onCancelEdit={onCancelEdit}
                onEditTextChange={onEditTextChange}
                onRemove={() => onRemoveItem(item.id)}
                onDragStart={(e) => onDragStart(e, item)}
                onDragOver={(e) => onItemDragOver(e, section, index)}
                onDragLeave={onItemDragLeave}
                onDrop={(e) => onItemDrop(e, index)}
              />
            </div>
          )
        })}
        
        {/* Drop indicator at the end - positioned before the drop zone */}
        {dropIndicator?.section === section && dropIndicator?.index === items.length && (
          <div className="h-1 rounded-full bg-blue-500 shadow-md shadow-blue-300 animate-pulse" />
        )}
        
        {/* Drop zone at the end */}
        <div
          className="h-4 opacity-0"
          onDragOver={(e) => onItemDragOver(e, section, items.length)}
          onDragLeave={onItemDragLeave}
          onDrop={(e) => onItemDrop(e, items.length)}
        />
      </div>
    </div>
  )
} 