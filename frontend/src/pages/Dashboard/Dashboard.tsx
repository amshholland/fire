import React from 'react';
import './Dashboard.css'
import PlaidLinkButton from '../../components/PlaidLinkButton/PlaidLinkButton.tsx'
import Transactions from '../Transactions/Transactions.tsx'

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <PlaidLinkButton />
      <Transactions />
    </div>
  )
}

export default Dashboard;