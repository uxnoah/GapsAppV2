import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home Page', () => {
  it('renders the GAPS diagram component', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { name: /gaps diagram/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders all four GAPS sections', () => {
    render(<Home />)
    
    expect(screen.getByText('Goal')).toBeInTheDocument()
    expect(screen.getByText('Analysis')).toBeInTheDocument()
    expect(screen.getByText('Plan')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders sample data items', () => {
    render(<Home />)
    
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByText('Finish project')).toBeInTheDocument()
    expect(screen.getByText('Need better time management')).toBeInTheDocument()
    expect(screen.getByText('Work 2 hours daily')).toBeInTheDocument()
  })

  it('has add buttons for each section', () => {
    render(<Home />)
    
    const addButtons = screen.getAllByText('+')
    expect(addButtons).toHaveLength(4)
  })
}) 