/**
 * Budget Setup Page
 *
 * Simple interface for assigning planned amounts to categories.
 * Allows users to create or update monthly budgets.
 *
 * Features:
 * - Category list with amount inputs
 * - Month/year selector
 * - Running total of planned amounts
 * - Save button
 * - No spending data displayed
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Input,
  Button,
  Spin,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Space,
  Empty
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import {
  BudgetSetupRequest,
  BudgetSetupItem
} from '../../types/budget-setup.types'
import { useUserAuth } from '../../hooks/useUserAuth'
import { getMonthName } from '../../utils/dateUtils'
import MonthNavigation from '../../components/MonthNavigation/MonthNavigation'
import './BudgetSetupPage.css'

const { Title, Text } = Typography

interface Category {
  id: number
  name: string
  description: string | null
}

const BudgetSetupPage: React.FC = () => {
  const { user } = useUserAuth()
  const userId = user?.sub || ''

  const [categories, setCategories] = useState<Category[]>([])
  const [budgetAmounts, setBudgetAmounts] = useState<Record<number, number>>({})
  const [savedBudgetAmounts, setSavedBudgetAmounts] = useState<
    Record<number, number>
  >({})
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  )
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  )
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)

  // Fetch categories and budgets on mount and when month/year changes
  useEffect(() => {
    if (userId) {
      const loadData = async () => {
        try {
          setLoading(true)
          await fetchCategories()
          await fetchBudgets()
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [userId, selectedMonth, selectedYear])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories?user_id=${userId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      message.error('Failed to load categories')
    }
  }

  const fetchBudgets = async () => {
    try {
      const response = await fetch(
        `/api/budgets?userId=${userId}&month=${selectedMonth}&year=${selectedYear}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(
          '❌ Budgets API error - Status:',
          response.status,
          'Error:',
          errorData
        )
        throw new Error(`Failed to fetch budgets: ${response.status}`)
      }

      const data = await response.json()
      const categoryBudgets = data.categoryBudgets || []
      console.log('📥 Fetched budgets from backend:', categoryBudgets)

      // Pre-populate budgetAmounts from fetched budgets
      const amounts: Record<number, number> = {}
      categoryBudgets.forEach(
        (budget: { category_id: number; budgeted_amount: number }) => {
          amounts[budget.category_id] = budget.budgeted_amount
        }
      )
      console.log('💾 Setting budgetAmounts to:', amounts)
      setBudgetAmounts(amounts)
      setSavedBudgetAmounts(amounts)
    } catch (error) {
      console.error('Error fetching budgets:', error)
      // Don't show error for missing budgets - it's normal for new months
      setBudgetAmounts({})
    }
  }

  // Calculate total planned amount
  const totalPlanned = useMemo(() => {
    return Object.values(budgetAmounts).reduce(
      (sum, amount) => sum + (amount || 0),
      0
    )
  }, [budgetAmounts])

  // Check if budgets have been modified since last save
  const hasUnsavedChanges = useMemo(() => {
    // Compare current amounts to saved amounts
    const currentKeys = Object.keys(budgetAmounts).map(Number)
    const savedKeys = Object.keys(savedBudgetAmounts).map(Number)

    // If the keys are different, there are changes
    if (currentKeys.length !== savedKeys.length) {
      return true
    }

    // Check if any values have changed
    return currentKeys.some(
      (key) => (budgetAmounts[key] || 0) !== (savedBudgetAmounts[key] || 0)
    )
  }, [budgetAmounts, savedBudgetAmounts])

  // Handle amount input change
  const handleAmountChange = (categoryId: number, value: string) => {
    const numValue = parseFloat(value) || 0
    setBudgetAmounts((prev) => ({
      ...prev,
      [categoryId]: numValue
    }))
  }

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true)

      // Build budget items from entered amounts
      const budgetItems: BudgetSetupItem[] = categories
        .filter(
          (cat) =>
            budgetAmounts[cat.id] !== undefined && budgetAmounts[cat.id]! > 0
        )
        .map((cat) => ({
          category_id: cat.id,
          category_name: cat.name,
          planned_amount: budgetAmounts[cat.id] || 0
        }))

      if (budgetItems.length === 0) {
        message.warning('Please enter at least one budget amount')
        return
      }

      const requestBody: BudgetSetupRequest = {
        user_id: userId,
        month: selectedMonth,
        year: selectedYear,
        budgets: budgetItems
      }

      const response = await fetch('/api/budgets/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save budget')
      }

      const result = await response.json()
      message.success(
        `Successfully saved ${result.count} budget(s) for ${getMonthName(selectedMonth)} ${selectedYear}. Switch to the Budget page to see the updated budgets.`
      )
      // Update saved state to match current amounts
      setSavedBudgetAmounts(budgetAmounts)
      // Refresh budgets to reflect changes immediately
      await fetchBudgets()
    } catch (error) {
      console.error('Error saving budget:', error)
      message.error(
        error instanceof Error ? error.message : 'Failed to save budget'
      )
    } finally {
      setSaving(false)
    }
  }

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  if (loading) {
    return (
      <div className="budget-setup-loading">
        <Spin size="large" />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="budget-setup-empty">
        <Card className="budget-setup-card">
          <Empty
            description="No categories available"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="budget-setup-page">
      <Card className="budget-setup-card">
        <Title level={2}>Setup Monthly Budget</Title>
        <Text type="secondary">
          Assign planned amounts to each category for your budget
        </Text>

        <Divider />

        {/* Month and Year Navigation */}
        <div className="month-navigation-section">
          <MonthNavigation
            month={selectedMonth}
            year={selectedYear}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />
        </div>

        <Divider />

        {/* Category List with Amount Inputs */}
        <div className="budget-setup-categories">
          <Title level={4}>Category Budgets</Title>
          <div className="category-list">
            {categories.map((category) => (
              <Row
                key={category.id}
                className="category-row"
                gutter={16}
                align="middle"
              >
                <Col span={12}>
                  <Text strong>{category.name}</Text>
                  {category.description && (
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {category.description}
                      </Text>
                    </div>
                  )}
                </Col>
                <Col span={12}>
                  <Input
                    prefix="$"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder={
                      category.id in savedBudgetAmounts &&
                      savedBudgetAmounts[category.id]! > 0
                        ? `${savedBudgetAmounts[category.id]!.toFixed(2)}`
                        : '0.00'
                    }
                    value={budgetAmounts[category.id] ?? ''}
                    onChange={(e) =>
                      handleAmountChange(category.id, e.target.value)
                    }
                    size="large"
                    className="amount-input"
                  />
                </Col>
              </Row>
            ))}
          </div>
        </div>

        <Divider />

        {/* Total and Save Button */}
        <Row
          justify="space-between"
          align="middle"
          className="budget-setup-footer"
        >
          <Col>
            <Space direction="vertical" size={0}>
              <Text type="secondary">Estimated Monthly Total</Text>
              <Title level={3} style={{ margin: 0 }}>
                ${totalPlanned.toFixed(2)}
              </Title>
              {totalPlanned === 0 && (
                <Text type="warning" style={{ fontSize: '12px', marginTop: 8 }}>
                  Enter amounts above to enable saving
                </Text>
              )}
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={totalPlanned === 0 || !hasUnsavedChanges}
            >
              Save Budget
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default BudgetSetupPage
