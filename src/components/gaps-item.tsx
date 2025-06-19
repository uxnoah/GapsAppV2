'use client'

import React, { useState, useRef } from 'react'
import { GapsItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GapsItemProps {
  item: GapsItem
  isEditing: boolean
  editText: string
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditTextChange: (text: string) => void
  onRemove: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

export const GapsItemComponent: React.FC<GapsItemProps> = ({
  item,
  isEditing,
  editText,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [clickPosition, setClickPosition] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit()
    } else if (e.key === 'Escape') {
      onCancelEdit()
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.pageX, y: e.pageY })
    setShowContextMenu(true)
  }

  const handleDelete = () => {
    setShowContextMenu(false)
    onRemove()
  }

  const handleClickOutside = () => {
    setShowContextMenu(false)
  }

  const getClickPosition = (e: React.MouseEvent, text: string) => {
    if (!spanRef.current) return text.length

    const span = spanRef.current
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
    for (let i = 0; i <= text.length; i++) {
      tempSpan.textContent = text.slice(0, i)
      if (tempSpan.offsetWidth > clickX) {
        position = Math.max(0, i - 1)
        break
      }
      position = i
    }

    document.body.removeChild(tempSpan)
    return position
  }

  const handleSpanClick = (e: React.MouseEvent) => {
    const position = getClickPosition(e, item.text)
    setClickPosition(position)
    onStartEdit()
  }

  // Set cursor position when input becomes active
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      // Small delay to ensure input is fully rendered
      setTimeout(() => {
        if (inputRef.current) {
          // If text is "New thought", select all text for easy replacement
          if (editText === 'New thought') {
            inputRef.current.select()
          } else if (clickPosition !== null) {
            // Otherwise, position cursor at click location
            inputRef.current.setSelectionRange(clickPosition, clickPosition)
          }
        }
      }, 0)
    }
  }, [isEditing, clickPosition, editText])

  // Close context menu when clicking outside
  React.useEffect(() => {
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showContextMenu])

  return (
    <>
      <div 
        draggable={!isEditing}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onContextMenu={handleContextMenu}
        className={cn(
          'bg-white border border-gray-300 rounded-lg p-2 flex justify-between items-center transition-all duration-200',
          'hover:shadow-md hover:border-gray-400',
          !isEditing && 'cursor-move',
          isEditing && 'cursor-text'
        )}
      >
        {/* Item Content */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900"
            aria-label="Edit item text"
          />
        ) : (
          <span 
            ref={spanRef}
            onClick={handleSpanClick}
            className="flex-1 cursor-move text-sm select-none text-gray-900"
            tabIndex={0}
            role="button"
            aria-label="Click to edit item"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setClickPosition(item.text.length) // Place at end for keyboard activation
                onStartEdit()
              }
            }}
          >
            {item.text}
          </span>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-50"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </>
  )
} 