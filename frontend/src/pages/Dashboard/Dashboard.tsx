import React from 'react';
import { Tabs } from 'antd'
import './Dashboard.css'
import Transactions from '../Transactions/Transactions.tsx'
import BudgetPage from '../BudgetPage/BudgetPage.tsx'

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: 'Budget',
            children: <BudgetPage />
          },
          {
            key: '2',
            label: 'Transactions',
            children: <Transactions />
          }
        ]}
      />
    </div>
  )
}

export default Dashboard;