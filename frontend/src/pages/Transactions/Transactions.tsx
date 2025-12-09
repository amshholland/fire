import React, { useState, useEffect } from 'react'
import { Table, Alert, Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table/InternalTable.js'
import PlaidLinkComponent from '../../components/PlaidLink/PlaidLink'
import { getTransactions, PlaidTransaction } from '../../services/plaidService'

const { Title } = Typography

interface DataType {
  transaction_id: string
  merchant_name: string
  amount: number
  category?: string
  date: string
  name: string
}

const Transactions: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch transactions from Plaid API
  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      // Get transactions for the last 30 days
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const response = await getTransactions(startDate, endDate)

      const formattedTransactions: DataType[] = response.transactions.map(
        (transaction: PlaidTransaction) => ({
          transaction_id: transaction.transaction_id,
          merchant_name: transaction.merchant_name || transaction.name,
          amount: transaction.amount,
          category: transaction.category?.join(', '),
          date: transaction.date,
          name: transaction.name
        })
      )

      setDataSource(formattedTransactions)
      setIsConnected(true)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch transactions'
      setError(errorMessage)
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle successful bank connection
  const handlePlaidSuccess = (accessToken: string, itemId: string) => {
    console.log('Bank account connected successfully!')
    setIsConnected(true)
    fetchTransactions()
  }

  // Handle Plaid errors
  const handlePlaidError = (error: Error) => {
    setError(error.message)
  }

  const columns: ColumnsType<DataType> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Merchant',
      dataIndex: 'merchant_name',
      key: 'merchant_name'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
      sorter: (a, b) => b.amount - a.amount
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category'
    }
  ]

  return (
    <div className="transactions">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Title level={2}>Transactions</Title>
          {!isConnected && (
            <PlaidLinkComponent
              onSuccess={handlePlaidSuccess}
              onError={handlePlaidError}
            />
          )}
        </div>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        {!isConnected && !error && (
          <Alert
            message="Connect Your Bank Account"
            description="Click the button above to securely connect your bank account and view your transactions."
            type="info"
            showIcon
          />
        )}

        <Table
          dataSource={dataSource}
          columns={columns}
          loading={loading}
          rowKey="transaction_id"
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} transactions`
          }}
        />
      </Space>
    </div>
  )
}

export default Transactions
