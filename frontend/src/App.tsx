import { useEffect } from 'react'

import Header from './components/Header/Header.tsx'
import Products from './components/ProductTypes/Products.tsx'
import { useContext } from 'react'
import Context from './context/index.tsx'
import Transactions from './pages/Transactions/Transactions.tsx'
import { useAppInitialization } from './hooks/useAppInitialization.ts'

import styles from './App.css'

const App = () => {
  const { linkSuccess } = useContext(Context)
  const initializeApp = useAppInitialization()

  useEffect(() => {
    initializeApp()
  }, [initializeApp])

  return (
    <div className={styles.App}>
      <div className={styles.container}>
        <Header />
        {linkSuccess && (
          <>
            <Products />
            <Transactions />
          </>
        )}
      </div>
    </div>
  )
}

export default App
