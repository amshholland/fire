import React, { useState, useEffect, useContext, useCallback } from 'react'
import { Table, Button, message, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table/InternalTable.js'
import Context from '../../context/plaidContext.tsx'

interface Transaction {
  transaction_id: string
  merchant_name?: string
  name?: string
  amount: number
  date?: string
  category?: string[]
}

interface TransactionsResponse {
  latest_transactions?: Transaction[]
  transactions?: Transaction[]
  error?: string
}

/**
 * Fetches transactions from the backend API
 */
const fetchTransactionsData = async (
  accessToken: string
): Promise<Transaction[]> => {
  if (!accessToken) {
    throw new Error(
      'Access token not available. Please link your account first.'
    )
  }

  const params = new URLSearchParams({ access_token: accessToken })
  const response = await fetch(`/api/transactions?${params}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch transactions')
  }

  const data: TransactionsResponse = await response.json()
  return data.latest_transactions || data.transactions || []
}

const Transactions: React.FC = () => {
  const [dataSource, setDataSource] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const { accessToken } = useContext(Context)

  const handleFetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const transactions = await fetchTransactionsData(accessToken!)
      setDataSource(transactions)
      message.success(`Fetched ${transactions.length} transactions`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    handleFetchTransactions()
  }, [handleFetchTransactions])

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Merchant Name',
      dataIndex: 'merchant_name',
      key: 'merchant_name',
      render: (_text, record) => record.merchant_name || record.name || 'N/A'
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
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string[] | string | undefined) =>
        Array.isArray(category) ? category.join(', ') : category || 'N/A'
    }
  ]

  return (
    <div>
      <h1>Transactions</h1>
      <Button
        type="primary"
        onClick={handleFetchTransactions}
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
