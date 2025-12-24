import React, { useState, useEffect, useContext, useCallback } from 'react'
import { Table, Button, message, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table/InternalTable.js'
import Context from '../../context/plaidContext.tsx'

interface Transaction {
  id?: number
  transaction_id: string
  merchant?: string | null
  amount: number
  date?: string
  // Plaid category data (immutable, stored verbatim)
  plaid_category_primary?: string | null
  plaid_category_detailed?: string | null
  plaid_category_confidence?: number | null
  // App category (authoritative for budgets/reports)
  category_id?: number | null
  category_name?: string | null
}

/**
 * Fetch all transactions from the database for a user
 */
const fetchTransactionsFromDB = async (
  userId: string
): Promise<Transaction[]> => {
  const response = await fetch(`/api/user/${userId}/transactions`, {
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
 * Sync new transactions from Plaid and return all transactions
 */
const syncTransactionsWithPlaid = async (
  userId: string,
  accessToken: string
): Promise<Transaction[]> => {
  const response = await fetch(`/api/user/${userId}/transactions/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken })
  })

  if (!response.ok) {
    throw new Error('Failed to sync transactions')
  }

  const data = await response.json()
  return data.transactions || []
}

const Transactions: React.FC = () => {
  const [dataSource, setDataSource] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const { accessToken } = useContext(Context)
  const [userId, setUserId] = useState<string | null>(null)

  // Get userId from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('googleUser')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUserId(user.userId)
      } catch (error) {
        console.error('Failed to parse user data:', error)
      }
    }
  }, [])

  // Load transactions from database on mount
  const handleLoadTransactions = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const transactions = await fetchTransactionsFromDB(userId)
      setDataSource(transactions)
      message.success(`Loaded ${transactions.length} transactions`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Refresh transactions - sync from Plaid and get all transactions
  const handleRefreshTransactions = useCallback(async () => {
    if (!userId || !accessToken) {
      message.error('Missing user ID or access token')
      return
    }

    setLoading(true)
    try {
      const transactions = await syncTransactionsWithPlaid(userId, accessToken)
      setDataSource(transactions)
      message.success(`Synced and loaded ${transactions.length} transactions`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [userId, accessToken])

  // Load transactions on mount
  useEffect(() => {
    if (userId) {
      handleLoadTransactions()
    }
  }, [userId, handleLoadTransactions])

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Merchant Name',
      dataIndex: 'merchant',
      key: 'merchant',
      render: (merchant: string | null | undefined) => merchant || 'N/A'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${Math.abs(amount).toFixed(2)}`
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Plaid Category',
      dataIndex: 'plaid_category_primary',
      key: 'plaid_category',
      render: (primary: string | null | undefined, record: Transaction) => {
        if (primary) {
          const confidence = record.plaid_category_confidence
            ? ` (${(record.plaid_category_confidence * 100).toFixed(0)}%)`
            : ''
          return `${primary}${confidence}`
        }
        return 'N/A'
      }
    },
    {
      title: 'App Category',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (categoryName: string | null | undefined) =>
        categoryName || 'Uncategorized'
    }
  ]

  return (
    <div>
      <h1>Transactions</h1>
      <Button
        type="primary"
        onClick={handleRefreshTransactions}
        loading={loading}
        style={{ marginBottom: '16px' }}
      >
        Refresh Transactions
      </Button>
      <Spin spinning={loading}>
        <Table<Transaction>
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          rowKey="transaction_id"
        />
      </Spin>
    </div>
  )
}

export default Transactions
