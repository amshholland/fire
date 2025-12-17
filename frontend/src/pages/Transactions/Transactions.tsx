import React, { useState, useEffect } from 'react'
import { Table, Button, message, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table/InternalTable.js'

interface DataType {
  transaction_id: string
  merchant_name?: string
  name?: string
  amount: number
  date?: string
  category?: string[]
}

const Transactions: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataType[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/transactions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      const transactions = data.latest_transactions || data.transactions || []
      setDataSource(transactions)
      message.success(`Fetched ${transactions.length} transactions`)
    } catch (error) {
      message.error('Error fetching transactions: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const columns: ColumnsType<DataType> = [
    {
      title: 'Merchant Name',
      dataIndex: 'merchant_name',
      key: 'merchant_name',
      render: (text, record) => text || record.name || 'N/A'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${Math.abs(amount).toFixed(2)}`
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
      render: (category) =>
        Array.isArray(category) ? category.join(', ') : category || 'N/A'
    }
  ]

  return (
    <div>
      <h1>Transactions</h1>
      <Button
        type="primary"
        onClick={fetchTransactions}
        loading={loading}
        style={{ marginBottom: '16px' }}
      >
        Refresh Transactions
      </Button>
      <Spin spinning={loading}>
        <Table
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
