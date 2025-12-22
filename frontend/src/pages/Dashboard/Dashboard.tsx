import React from 'react';
import './Dashboard.css'
import Products from '../../components/ProductTypes/Products.tsx'
import Transactions from '../Transactions/Transactions.tsx'

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <Products />
      <Transactions />
    </div>
  )
}

export default Dashboard;