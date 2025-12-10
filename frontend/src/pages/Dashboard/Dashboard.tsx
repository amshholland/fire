import React from 'react';
import './Dashboard.css'
import PlaidLink from '../../components/PlaidLink/PlaidLink.tsx'
import Transactions from '../Transactions/Transactions.tsx'

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <PlaidLink />
      <Transactions />
    </div>
  )
}

export default Dashboard;