import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GapsCanvas } from '../gaps-canvas'

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      title: 'Test Diagram',
      status: [],
      goal: [],
      analysis: [],
      plan: []
    }),
  })
) as jest.Mock

describe('GapsCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the main title', () => {
      render(<GapsCanvas />)
      
      const title = screen.getByText('GAPS Diagram')
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('cursor-text')
    })

    it('renders all four GAPS sections', () => {
      render(<GapsCanvas />)
      
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Goal')).toBeInTheDocument()
      expect(screen.getByText('Analysis')).toBeInTheDocument()
      expect(screen.getByText('Plan')).toBeInTheDocument()
    })

    it('renders with sample data', () => {
      render(<GapsCanvas />)
      
      // Check that sample items are rendered
      expect(screen.getByText('In progress')).toBeInTheDocument()
      expect(screen.getByText('Finish project')).toBeInTheDocument()
      expect(screen.getByText('Need better time management')).toBeInTheDocument()
      expect(screen.getByText('Work 2 hours daily')).toBeInTheDocument()
    })

    it('renders hand-drawn axes', () => {
      render(<GapsCanvas />)
      
      // Check SVG exists with hand-drawn paths
      const svg = document.querySelector('svg')
      expect(svg).toBeInTheDocument()
      
      // Check for hand-drawn paths (vertical and horizontal axes)
      const paths = document.querySelectorAll('path')
      expect(paths.length).toBeGreaterThanOrEqual(2) // At least vertical and horizontal axes
    })

    test('renders clean four-box layout without SVG axes', () => {
      render(<GapsCanvas />)
      
      // Check that all four section headers are present
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Goal')).toBeInTheDocument()
      expect(screen.getByText('Analysis')).toBeInTheDocument()
      expect(screen.getByText('Plan')).toBeInTheDocument()
      
      // Check that each section has an add button
      expect(screen.getAllByText('+')).toHaveLength(4)
      
      // Verify no SVG elements are present (no hand-drawn axes)
      const svgElements = document.querySelectorAll('svg')
      expect(svgElements).toHaveLength(0)
      
      // Verify clean grid layout classes
      const gridContainer = document.querySelector('.grid-cols-2')
      expect(gridContainer).toBeInTheDocument()
      expect(gridContainer).toHaveClass('gap-4')
    })

    test('each quadrant has proper styling for clean layout', () => {
      render(<GapsCanvas />)
      
      // Find all quadrant containers - more specific selector
      const quadrants = document.querySelectorAll('.grid-cols-2 > div[class*="bg-gray-50"]')
      expect(quadrants).toHaveLength(4)
      
      // Each quadrant should have clean styling
      quadrants.forEach(quadrant => {
        expect(quadrant).toHaveClass('bg-gray-50')
        expect(quadrant).toHaveClass('rounded-lg')
        expect(quadrant).toHaveClass('border-2')
        expect(quadrant).toHaveClass('border-gray-200')
        expect(quadrant).toHaveClass('p-6')
      })
    })
  })

  describe('Title Editing', () => {
    it('allows editing the main title', async () => {
      const user = userEvent.setup()
      render(<GapsCanvas />)
      
      const title = screen.getByText('GAPS Diagram')
      await user.click(title)
      
      const input = screen.getByDisplayValue('GAPS Diagram')
      expect(input).toBeInTheDocument()
      expect(input).toHaveFocus()
    })

    it('saves title changes on Enter key', async () => {
      const user = userEvent.setup()
      render(<GapsCanvas />)
      
      const title = screen.getByText('GAPS Diagram')
      await user.click(title)
      
      const input = screen.getByDisplayValue('GAPS Diagram')
      await user.clear(input)
      await user.type(input, 'My Custom Title')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('My Custom Title')).toBeInTheDocument()
      })
    })

    it('saves title changes on blur', async () => {
      const user = userEvent.setup()
      render(<GapsCanvas />)
      
      const title = screen.getByText('GAPS Diagram')
      await user.click(title)
      
      const input = screen.getByDisplayValue('GAPS Diagram')
      await user.clear(input)
      await user.type(input, 'Blurred Title')
      await user.tab() // Trigger blur
      
      await waitFor(() => {
        expect(screen.getByText('Blurred Title')).toBeInTheDocument()
      })
    })

    it('cancels title editing on Escape key', async () => {
      const user = userEvent.setup()
      render(<GapsCanvas />)
      
      const title = screen.getByText('GAPS Diagram')
      await user.click(title)
      
      const input = screen.getByDisplayValue('GAPS Diagram')
      await user.clear(input)
      await user.type(input, 'Should Not Save')
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.getByText('GAPS Diagram')).toBeInTheDocument()
        expect(screen.queryByText('Should Not Save')).not.toBeInTheDocument()
      })
    })
  })

  describe('Item Management', () => {
    it('adds new items to sections', async () => {
      const user = userEvent.setup()
      render(<GapsCanvas />)
      
      const addButton = screen.getByLabelText('Add item to Status')
      
      // Count existing items in Status section
      const statusItems = screen.getAllByText(/In progress|On track/)
      const initialCount = statusItems.length
      
      await user.click(addButton)
      
      await waitFor(() => {
        const newStatusItems = screen.getAllByText(/In progress|On track|New item/)
        expect(newStatusItems.length).toBe(initialCount + 1)
      })
    })

    it('adds items to different sections independently', async () => {
      const user = userEvent.setup()
      render(<GapsCanvas />)
      
      const addGoalButton = screen.getByLabelText('Add item to Goal')
      const addPlanButton = screen.getByLabelText('Add item to Plan')
      
      const initialGoalItems = screen.getAllByText(/^(Finish project|Learn new skills)$/)
      const initialPlanItems = screen.getAllByText(/^(Work 2 hours daily|Weekly reviews)$/)
      
      const initialGoalCount = initialGoalItems.length
      const initialPlanCount = initialPlanItems.length
      
      await user.click(addGoalButton)
      await user.click(addPlanButton)
      
      await waitFor(() => {
        const newGoalItems = screen.getAllByText(/^(Finish project|Learn new skills|New item)$/)
        const newPlanItems = screen.getAllByText(/^(Work 2 hours daily|Weekly reviews|New item)$/)
        expect(newGoalItems.length).toBe(initialGoalCount + 1)
        expect(newPlanItems.length).toBe(initialPlanCount + 1)
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<GapsCanvas />)
      
      const title = screen.getByRole('heading', { name: /gaps diagram/i })
      expect(title).toBeInTheDocument()
    })

    it('has interactive add buttons for each section', () => {
      render(<GapsCanvas />)
      
      const addButtons = [
        screen.getByLabelText('Add item to Status'),
        screen.getByLabelText('Add item to Goal'),
        screen.getByLabelText('Add item to Analysis'),
        screen.getByLabelText('Add item to Plan')
      ]
      
      expect(addButtons).toHaveLength(4)
      
      addButtons.forEach(button => {
        expect(button).toBeEnabled()
      })
    })

    it('has proper visual indicators for interactive elements', () => {
      render(<GapsCanvas />)
      
      const title = screen.getByText('GAPS Diagram')
      expect(title).toHaveClass('cursor-text')
      expect(title).toHaveClass('text-gray-900')
    })
  })

  describe('Error Handling', () => {
    it('handles invalid drag data gracefully', () => {
      render(<GapsCanvas />)
      
      // Find a quadrant div (Status section)
      const statusSection = screen.getByText('Status').closest('div')
      expect(statusSection).toBeInTheDocument()
      
      // Simulate drop with invalid data
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          getData: () => 'invalid json'
        }
      })
      
      // Should not throw an error
      expect(() => {
        fireEvent(statusSection!, dropEvent)
      }).not.toThrow()
    })

    it('handles missing item data gracefully', () => {
      render(<GapsCanvas />)
      
      // Find a quadrant div (Status section)
      const statusSection = screen.getByText('Status').closest('div')
      expect(statusSection).toBeInTheDocument()
      
      // Simulate drop with missing item data
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          getData: () => JSON.stringify({ itemId: 'non-existent', sourceSection: 'goal', sourceIndex: 0 })
        }
      })
      
      // Should not throw an error
      expect(() => {
        fireEvent(statusSection!, dropEvent)
      }).not.toThrow()
    })
  })
}) 