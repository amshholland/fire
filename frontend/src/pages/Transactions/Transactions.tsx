import React, { useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table/InternalTable.js'

interface DataType {
  transaction_id: string
  merchant_name: string
  amount: number
  category?: string
}

const plaidResponse = {
  transactions: [
    {
      transaction_id: 'yhnUVvtcGGcCKU0bcz8PDQr5ZUxUXebUvbKC0',
      merchant_name: 'Burger King',
      amount: 28.34,
      category: 'Food and Dining'
    },
    {
      transaction_id: 'lPNjeW1nR6CDn5okmGQ6hEpMo4lLNoSrzqDje',
      merchant_name: 'Walmart',
      amount: 72.1,
      category: 'Groceries'
    }
  ]
}

const Transactions: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataType[]>(
    plaidResponse.transactions.map((transaction) => ({
      transaction_id: transaction.transaction_id,
      merchant_name: transaction.merchant_name,
      amount: transaction.amount,
      category: transaction.category
    }))
  )

  const columns: ColumnsType<DataType> = [
    {
      title: 'Merchant Name',
      dataIndex: 'merchant_name',
      key: 'merchant_name'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category'
    }
  ]

  return (
    <div>
      <h1>Transactions</h1>
      <Table dataSource={dataSource} columns={columns} pagination={false} />
    </div>
  )
}

export default Transactions
