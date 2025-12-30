import React, { useState, useEffect } from 'react'
import { Table, message, Spin, Empty, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table/InternalTable.js'
import { TransactionItem } from '../../types/transaction.types'
import './Transactions.css'

const { Title } = Typography

/**
 * Format currency amount for display
 * Negative amounts are expenses, positive are income/refunds
 */
const formatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount)
  return amount < 0 ? `-$${absAmount.toFixed(2)}` : `$${absAmount.toFixed(2)}`
}

/**
 * Format date from YYYY-MM-DD to readable format
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Fetches recent transactions from the database
 */
const fetchRecentTransactions = async (
  userId: string,
  limit: number = 50
): Promise<TransactionItem[]> => {
  const params = new URLSearchParams({
    userId,
    limit: limit.toString()
  })

  const response = await fetch(`/api/transactions/db/recent?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch transactions')
  }

  const data = await response.json()
  return data.transactions || []
}

/**
 * Transactions Page Component
 *
 * Displays recent transactions in a read-only table view with:
 * - Date, merchant, amount, category, account columns
 * - Sorted by date descending (most recent first)
 * - Empty state handling
 * - Auto-loads on mount
 */
const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // TODO: Replace with actual user ID from auth context
  const userId = 'user-demo'

  /**
   * Load transactions on component mount
   */
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchRecentTransactions(userId, 50)
        setTransactions(data)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        message.error(`Failed to load transactions: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [userId])

  /**
   * Define table columns matching acceptance criteria
   */
  const columns: ColumnsType<TransactionItem> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: '12%',
      render: (date: string) => formatDate(date),
      sorter: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Merchant',
      dataIndex: 'merchant_name',
      key: 'merchant_name',
      width: '30%',
      ellipsis: true
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: '12%',
      align: 'right',
      render: (amount: number) => (
        <span className={amount < 0 ? 'amount-expense' : 'amount-income'}>
          {formatCurrency(amount)}
        </span>
      )
    },
    {
      title: 'Category',
      dataIndex: 'app_category_name',
      key: 'app_category_name',
      width: '20%',
      render: (categoryName: string | null) =>
        categoryName || <span className="text-muted">Uncategorized</span>
    },
    {
      title: 'Account',
      dataIndex: 'account_name',
      key: 'account_name',
      width: '20%',
      ellipsis: true,
      render: (accountName: string | null) =>
        accountName || <span className="text-muted">Unknown</span>
    }
  ]

  return (
    <div className="transactions-page">
      <Title level={2}>Recent Transactions</Title>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : error ? (
        <Empty
          description={
            <span>
              Failed to load transactions
              <br />
              {error}
            </span>
          }
        />
      ) : transactions.length === 0 ? (
        <Empty
          description="No transactions found"
          style={{ marginTop: '40px' }}
        />
      ) : (
        <Table<TransactionItem>
          dataSource={transactions}
          columns={columns}
          rowKey="transaction_id"
          pagination={{
            pageSize: 25,
            showSizeChanger: false,
            showTotal: (total) => `${total} transactions`
          }}
          size="middle"
          bordered
        />
      )}
    </div>
  )
}

export default Transactions
