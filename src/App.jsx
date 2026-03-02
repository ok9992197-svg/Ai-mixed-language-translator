import { useEffect } from 'react'
import { useAuthStore } from './lib/authStore'
import { Auth } from './components/Auth'
import { Dashboard } from './components/Dashboard'
import styles from './App.module.css'

function App() {
  const { session, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  return (
    <div className={styles.app}>
      {!session ? (
        <Auth />
      ) : (
        <div className={styles.dashboardLayout}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <h1>Bilingual Subtitle Translator</h1>
              <p>Translate subtitles into natural hybrid languages with AI</p>
            </div>
          </header>
          <Dashboard />
        </div>
      )}
    </div>
  )
}

export default App