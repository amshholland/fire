import React, { useState } from 'react'
import { Tabs } from 'antd'
import './Dashboard.css'
import Transactions from '../Transactions/Transactions.tsx'
import BudgetPage from '../BudgetPage/BudgetPage.tsx'

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('1')

  return (
    <div className="dashboard">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: '1',
            label: 'Budget',
            children: <BudgetPage isActive={activeTab === '1'} />
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

export default Dashboard
