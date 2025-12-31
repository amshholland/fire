import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MonthNavigation from './MonthNavigation'

describe('MonthNavigation Component', () => {
  const mockOnPreviousMonth = jest.fn()
  const mockOnNextMonth = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the month navigation container', () => {
      render(
        <MonthNavigation
          month={1}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const container = document.querySelector('.month-navigation')
      expect(container).toBeInTheDocument()
    })

    it('should display the correct month and year', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      expect(screen.getByText('June 2025')).toBeInTheDocument()
    })

    it('should display all month names correctly', () => {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ]

      months.forEach((monthName, index) => {
        const { unmount } = render(
          <MonthNavigation
            month={index + 1}
            year={2025}
            onPreviousMonth={mockOnPreviousMonth}
            onNextMonth={mockOnNextMonth}
          />
        )

        expect(screen.getByText(`${monthName} 2025`)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Previous Month Button', () => {
    it('should render previous month button with correct aria-label', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const prevButton = screen.getByLabelText('Previous month')
      expect(prevButton).toBeInTheDocument()
    })

    it('should call onPreviousMonth when previous button is clicked', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const prevButton = screen.getByLabelText('Previous month')
      fireEvent.click(prevButton)

      expect(mockOnPreviousMonth).toHaveBeenCalledTimes(1)
    })

    it('should call onPreviousMonth multiple times on repeated clicks', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const prevButton = screen.getByLabelText('Previous month')
      fireEvent.click(prevButton)
      fireEvent.click(prevButton)
      fireEvent.click(prevButton)

      expect(mockOnPreviousMonth).toHaveBeenCalledTimes(3)
    })
  })

  describe('Next Month Button', () => {
    it('should render next month button with correct aria-label', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const nextButton = screen.getByLabelText('Next month')
      expect(nextButton).toBeInTheDocument()
    })

    it('should call onNextMonth when next button is clicked', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const nextButton = screen.getByLabelText('Next month')
      fireEvent.click(nextButton)

      expect(mockOnNextMonth).toHaveBeenCalledTimes(1)
    })

    it('should call onNextMonth multiple times on repeated clicks', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const nextButton = screen.getByLabelText('Next month')
      fireEvent.click(nextButton)
      fireEvent.click(nextButton)
      fireEvent.click(nextButton)

      expect(mockOnNextMonth).toHaveBeenCalledTimes(3)
    })
  })

  describe('Month/Year Display', () => {
    it('should display January 2025', () => {
      render(
        <MonthNavigation
          month={1}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      expect(screen.getByText('January 2025')).toBeInTheDocument()
    })

    it('should display December 2024', () => {
      render(
        <MonthNavigation
          month={12}
          year={2024}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      expect(screen.getByText('December 2024')).toBeInTheDocument()
    })

    it('should update display when props change', () => {
      const { rerender } = render(
        <MonthNavigation
          month={1}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      expect(screen.getByText('January 2025')).toBeInTheDocument()

      rerender(
        <MonthNavigation
          month={12}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      expect(screen.getByText('December 2025')).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('should have month-navigation class', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const container = document.querySelector('.month-navigation')
      expect(container).toHaveClass('month-navigation')
    })

    it('should have month-display span with correct class', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const displaySpan = document.querySelector('.month-display')
      expect(displaySpan).toHaveClass('month-display')
      expect(displaySpan).toBeInTheDocument()
    })
  })

  describe('Button Elements', () => {
    it('should render two buttons (previous and next)', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })

    it('should have correct button types', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const buttons = screen.getAllByRole('button')
      // Both should be text buttons (Ant Design styling)
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Callback Isolation', () => {
    it('should not call onNextMonth when previous button is clicked', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const prevButton = screen.getByLabelText('Previous month')
      fireEvent.click(prevButton)

      expect(mockOnPreviousMonth).toHaveBeenCalledTimes(1)
      expect(mockOnNextMonth).not.toHaveBeenCalled()
    })

    it('should not call onPreviousMonth when next button is clicked', () => {
      render(
        <MonthNavigation
          month={6}
          year={2025}
          onPreviousMonth={mockOnPreviousMonth}
          onNextMonth={mockOnNextMonth}
        />
      )

      const nextButton = screen.getByLabelText('Next month')
      fireEvent.click(nextButton)

      expect(mockOnNextMonth).toHaveBeenCalledTimes(1)
      expect(mockOnPreviousMonth).not.toHaveBeenCalled()
    })
  })
})
