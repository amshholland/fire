import React, { useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table/InternalTable.js'

interface DataType {
  key: string
  name: string
  age: number
  address: string
}

const plaidResponse = {
  transactions: [
    {
      transaction_id: 'yhnUVvtcGGcCKU0bcz8PDQr5ZUxUXebUvbKC0',
      merchant_name: 'Burger King',
      amount: 28.34,
      location: {
        address: null
      }
    },
    {
      transaction_id: 'lPNjeW1nR6CDn5okmGQ6hEpMo4lLNoSrzqDje',
      merchant_name: 'Walmart',
      amount: 72.1,
      location: {
        address: '13425 Community Rd'
      }
    }
  ]
}

const Transactions: React.FC = () => {
  const [dataSource, setDataSource] = useState<DataType[]>(
    plaidResponse.transactions.map((transaction) => ({
      key: transaction.transaction_id,
      name: transaction.merchant_name || 'Unknown Merchant',
      age: transaction.amount,
      address: transaction.location.address || 'Address not available'
    }))
  )

  const columns: ColumnsType<DataType> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Amount',
      dataIndex: 'age',
      key: 'age'
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address'
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
