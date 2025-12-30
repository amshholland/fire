import React, { useState } from 'react'
import { Tabs } from 'antd'
import './Dashboard.css'
import Transactions from '../Transactions/Transactions.tsx'
import BudgetPage from '../BudgetPage/BudgetPage.tsx'
import BudgetSetupPage from '../BudgetSetupPage/BudgetSetupPage.tsx'
import { useUserAuth } from '../../hooks/useUserAuth'

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('1')
  const { user } = useUserAuth()
  const userId = user?.sub || ''

  return (
    <div className="dashboard">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: '1',
            label: 'Budget Setup',
            children: <BudgetSetupPage userId={userId || ''} />
          },
          {
            key: '2',
            label: 'Budget',
            children: <BudgetPage isActive={activeTab === '2'} />
          },
          {
            key: '3',
            label: 'Transactions',
            children: <Transactions />
          }
        ]}
      />
    </div>
  )
}

export default Dashboard
