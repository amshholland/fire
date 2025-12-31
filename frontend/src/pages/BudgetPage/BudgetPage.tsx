import {
  Card,
  Row,
  Col,
  Spin,
  Empty,
  message,
  Progress,
  Statistic,
  Table,
  Alert,
  Tag
} from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import './BudgetPage.css'
import { ColumnsType } from 'antd/es/table/InternalTable.js'
import { useState, useEffect, useCallback } from 'react'
import { useUserAuth } from '../../hooks/useUserAuth'
import MonthNavigation from '../../components/MonthNavigation/MonthNavigation'

interface CategoryBudget {
  category_id: number
  category_name: string
  budgeted_amount: number
  spent_amount: number
  remaining_amount: number
  percentage_used: number
}

interface BudgetSummary {
  total_budgeted: number
  total_spent: number
  total_remaining: number
  overall_percentage_used: number
}

interface BudgetPageResponse {
  month: number
  year: number
  categoryBudgets: CategoryBudget[]
  summary: BudgetSummary
}

interface BudgetPageProps {
  isActive?: boolean
}

const BudgetPage: React.FC<BudgetPageProps> = ({ isActive = true }) => {
  const { user } = useUserAuth()
  const userId = user?.sub || ''

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [data, setData] = useState<BudgetPageResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch budget page data from API
   */
  const fetchBudgetData = useCallback(
    async (selectedMonth: number, selectedYear: number) => {
      if (!userId) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          userId,
          month: String(selectedMonth),
          year: String(selectedYear)
        })

        const response = await fetch(`/api/budgets?${params}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch budget data')
        }

        const budgetData: BudgetPageResponse = await response.json()
        setData(budgetData)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        message.error(`Failed to load budget: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  /**
   * Load budget data on component mount and when month/year changes
   */
  useEffect(() => {
    fetchBudgetData(month, year)
  }, [month, year, fetchBudgetData])

  /**
   * Refetch budget data when tab becomes active
   * This ensures budget reflects any category changes made in Transactions tab
   */
  useEffect(() => {
    if (isActive) {
      fetchBudgetData(month, year)
    }
  }, [isActive, month, year, fetchBudgetData])

  /**
   * Navigate to previous month
   */
  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  /**
   * Navigate to next month
   */
  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  /**
   * Determine progress status based on percentage used
   */
  const getProgressStatus = (
    percentageUsed: number
  ): 'success' | 'normal' | 'exception' => {
    if (percentageUsed > 100) return 'exception'
    if (percentageUsed > 80) return 'normal'
    return 'success'
  }

  /**
   * Format currency
   */
  const formatCurrency = (value: number): string => {
    return `$${Math.abs(value).toFixed(2)}`
  }

  /**
   * Define table columns for category budgets
   */
  const columns: ColumnsType<CategoryBudget> = [
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name',
      width: '20%',
      render: (text: string, record: CategoryBudget) => (
        <div>
          <strong>{text}</strong>
          {record.budgeted_amount === 0 && (
            <>
              {' '}
              <Tag color="red">No Budget</Tag>
            </>
          )}
        </div>
      )
    },
    {
      title: 'Budgeted',
      dataIndex: 'budgeted_amount',
      key: 'budgeted_amount',
      width: '15%',
      align: 'right',
      render: (amount: number) =>
        amount === 0 ? (
          <span style={{ color: '#d4380d' }}>—</span>
        ) : (
          formatCurrency(amount)
        )
    },
    {
      title: 'Spent',
      dataIndex: 'spent_amount',
      key: 'spent_amount',
      width: '15%',
      align: 'right',
      render: (amount: number) => (
        <span style={{ color: amount < 0 ? '#d4380d' : '#52c41a' }}>
          {formatCurrency(amount)}
        </span>
      )
    },
    {
      title: 'Remaining',
      dataIndex: 'remaining_amount',
      key: 'remaining_amount',
      width: '15%',
      align: 'right',
      render: (amount: number, record: CategoryBudget) => (
        <span
          style={{
            color:
              record.budgeted_amount === 0
                ? '#d4380d'
                : amount >= 0
                  ? '#52c41a'
                  : '#d4380d'
          }}
        >
          {formatCurrency(amount)}
        </span>
      )
    },
    {
      title: 'Progress',
      dataIndex: 'percentage_used',
      key: 'percentage_used',
      width: '35%',
      render: (percentageUsed: number, record: CategoryBudget) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Progress
            type="line"
            percent={Math.min(percentageUsed, 100)}
            status={
              record.budgeted_amount === 0
                ? 'exception'
                : getProgressStatus(percentageUsed)
            }
            style={{ flex: 1, marginBottom: 0 }}
          />
          <span style={{ minWidth: '50px', textAlign: 'right' }}>
            {percentageUsed.toFixed(1)}%
          </span>
        </div>
      )
    }
  ]

  return (
    <div className="budget-page">
      <Card
        title={
          <div className="budget-header">
            <h2>Budget</h2>
            <MonthNavigation
              month={month}
              year={year}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
            />
          </div>
        }
        style={{ marginBottom: '24px' }}
      >
        {error && (
          <Alert
            message="Error Loading Budget"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
            onClose={() => setError(null)}
          />
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} />} />
          </div>
        ) : data && data.categoryBudgets.length > 0 ? (
          <>
            {/* Summary Statistics */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Budgeted"
                  value={formatCurrency(data.summary.total_budgeted)}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Spent"
                  value={formatCurrency(data.summary.total_spent)}
                  valueStyle={{
                    color:
                      Math.abs(data.summary.total_spent) >
                      data.summary.total_budgeted
                        ? '#d4380d'
                        : '#52c41a'
                  }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Remaining"
                  value={formatCurrency(data.summary.total_remaining)}
                  valueStyle={{
                    color:
                      data.summary.total_remaining >= 0 ? '#52c41a' : '#d4380d'
                  }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Overall Usage"
                  value={data.summary.overall_percentage_used.toFixed(1)}
                  suffix="%"
                  valueStyle={{
                    color:
                      data.summary.overall_percentage_used > 100
                        ? '#d4380d'
                        : '#52c41a'
                  }}
                />
              </Col>
            </Row>

            {/* Category Budget Table */}
            <Table<CategoryBudget>
              columns={columns}
              dataSource={data.categoryBudgets}
              rowKey="category_id"
              pagination={false}
              size="middle"
            />
          </>
        ) : !loading ? (
          <Empty
            description="No budget data available for this month"
            style={{ marginTop: '40px' }}
          />
        ) : null}
      </Card>

      {/* Help text */}
      <div style={{ color: '#666', fontSize: '12px', marginTop: '16px' }}>
        💡 Use the navigation arrows to view budgets for different months.
        Budget allocations are read-only on this page.
      </div>
    </div>
  )
}

export default BudgetPage
