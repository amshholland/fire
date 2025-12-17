import React from 'react';
import './Dashboard.css'
import Link from '../../components/Link/Link.tsx'
import Transactions from '../Transactions/Transactions.tsx'

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <Link />
      <Transactions />
    </div>
  )
}

export default Dashboard;