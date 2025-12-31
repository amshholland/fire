import React, { useState, useEffect } from 'react';
import { Select, message } from 'antd';
import type { SelectProps } from 'antd';

interface Category {
  id: number;
  name: string;
}

interface CategorySelectorProps {
  currentCategoryId: number | null
  currentCategoryName: string | null
  plaidPrimaryCategory?: string | null
  transactionId: string
  userId: string
  onCategoryChange?: (categoryId: number, categoryName: string) => void
  disabled?: boolean
}

/**
 * Category Selector Component
 * 
 * Dropdown selector for updating transaction categories.
 * Shows system categories and handles optimistic UI updates.
 */
const CategorySelector: React.FC<CategorySelectorProps> = ({
  currentCategoryId,
  currentCategoryName,
  plaidPrimaryCategory,
  transactionId,
  userId,
  onCategoryChange,
  disabled = false
}) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    currentCategoryId
  )

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/debug/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        setCategories(data.categories || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
        message.error('Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Update local state when prop changes
  useEffect(() => {
    setSelectedCategoryId(currentCategoryId)
  }, [currentCategoryId])

  const handleCategoryChange = async (newCategoryId: number) => {
    const newCategory = categories.find((cat) => cat.id === newCategoryId)
    if (!newCategory) return

    // Optimistic UI update
    setSelectedCategoryId(newCategoryId)
    if (onCategoryChange) {
      onCategoryChange(newCategoryId, newCategory.name)
    }

    setUpdating(true)

    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/category`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            category_id: newCategoryId,
            userId
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        // Revert optimistic update on error
        setSelectedCategoryId(currentCategoryId)
        if (onCategoryChange && currentCategoryId && currentCategoryName) {
          onCategoryChange(currentCategoryId, currentCategoryName)
        }
        message.error(data.error || 'Failed to update category')
        return
      }

      message.success('Category updated successfully')
    } catch (error) {
      // Revert optimistic update on error
      setSelectedCategoryId(currentCategoryId)
      if (onCategoryChange && currentCategoryId && currentCategoryName) {
        onCategoryChange(currentCategoryId, currentCategoryName)
      }
      console.error('Error updating category:', error)
      message.error('Network error: Failed to update category')
    } finally {
      setUpdating(false)
    }
  }

  const options: SelectProps['options'] = categories.map((category) => ({
    label: category.name,
    value: category.id
  }))

  // Add special options at the top
  const needsCategorizedOption = {
    label: '⚠️ Needs Categorized',
    value: 0
  }

  if (currentCategoryId === null || currentCategoryId === 0) {
    // Uncategorized - show at the top
    options.unshift(needsCategorizedOption)
  } else {
    // Add placeholder for uncategorized
    options.unshift({
      label: 'Uncategorized',
      value: 0
    })
  }

  // Show helpful tooltip with Plaid suggestion if available
  const getPlaceholder = () => {
    if (currentCategoryId === null || currentCategoryId === 0) {
      return plaidPrimaryCategory
        ? `Suggested: ${plaidPrimaryCategory}`
        : 'Needs Categorized'
    }
    return 'Select category'
  }

  return (
    <Select
      value={selectedCategoryId || 0}
      onChange={handleCategoryChange}
      options={options}
      loading={loading || updating}
      disabled={disabled || loading || updating}
      style={{
        width: '100%',
        minWidth: '120px',
        ...(currentCategoryId === null || currentCategoryId === 0
          ? { borderColor: '#ff7875', backgroundColor: '#fff1f0' }
          : {})
      }}
      placeholder={getPlaceholder()}
      showSearch
      filterOption={(input, option) =>
        String(option?.label ?? '')
          .toLowerCase()
          .includes(input.toLowerCase())
      }
    />
  )
}

export default CategorySelector;
