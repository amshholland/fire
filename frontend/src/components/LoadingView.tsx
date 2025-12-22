import React from 'react'
import styles from '../App.css'

/**
 * Loading view displayed while authentication state is initializing
 */
export const LoadingView: React.FC = () => (
  <div className={styles.App}>
    <div className={styles.container}>Loading...</div>
  </div>
)
