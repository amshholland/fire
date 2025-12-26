import {
  Card,
  Row,
  Col,
  Spin,
  Empty,
  message,
  Button,
  Progress,
  Statistic,
  Table,
  Alert
} from 'antd'
import { LeftOutlined, RightOutlined, LoadingOutlined } from '@ant-design/icons'
import './BudgetPage.css'
import { ColumnsType } from 'antd/es/table/InternalTable.js'
import { useState, useEffect } from 'react'
import { mockBudgetData } from './__mocks__/budgetPageMockData.ts'

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

const BudgetPage: React.FC = () => {
  // Set to true to use mock data for development
  const USE_MOCK_DATA = true

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [data, setData] = useState<BudgetPageResponse | null>(
    USE_MOCK_DATA ? mockBudgetData : null
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Get userId from context or localStorage
  // For now, using a placeholder - in production, get from auth context
  const userId = 'user-demo'

  /**
   * Fetch budget page data from API
   */
  const fetchBudgetData = async (
    selectedMonth: number,
    selectedYear: number
  ) => {
    // Skip API call if using mock data
    if (USE_MOCK_DATA) {
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      if (message && message.error) {
        message.error(`Failed to load budget: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load budget data on component mount and when month/year changes
   */
  useEffect(() => {
    fetchBudgetData(month, year)
  }, [month, year])

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
   * Get month name from number
   */
  const getMonthName = (m: number): string => {
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
    return months[m - 1] ?? ''
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
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Budgeted',
      dataIndex: 'budgeted_amount',
      key: 'budgeted_amount',
      width: '15%',
      align: 'right',
      render: (amount: number) => formatCurrency(amount)
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
      render: (amount: number) => (
        <span style={{ color: amount >= 0 ? '#52c41a' : '#d4380d' }}>
          {formatCurrency(amount)}
        </span>
      )
    },
    {
      title: 'Progress',
      dataIndex: 'percentage_used',
      key: 'percentage_used',
      width: '35%',
      render: (percentageUsed: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Progress
            type="line"
            percent={Math.min(percentageUsed, 100)}
            status={getProgressStatus(percentageUsed)}
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
            <div className="month-navigation">
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={handlePreviousMonth}
                aria-label="Previous month"
              />
              <span className="month-display">
                {getMonthName(month)} {year}
              </span>
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={handleNextMonth}
                aria-label="Next month"
              />
            </div>
          </div>
        }
        bordered={false}
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
              bordered
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
