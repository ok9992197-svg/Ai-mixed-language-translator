import { useState } from 'react'
import { useAuthStore } from '../lib/authStore'
import { Mail, Lock, LogOut, Loader } from 'lucide-react'
import styles from './Auth.module.css'

export function Auth() {
  const { session, signUp, signIn, signOut, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader size={32} />
      </div>
    )
  }

  if (session) {
    return (
      <div className={styles.userContainer}>
        <div className={styles.userInfo}>
          <span>{session.user.email}</span>
        </div>
        <button
          onClick={() => signOut()}
          className={styles.signOutBtn}
          title="Sign out"
        >
          <LogOut size={20} />
        </button>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setAuthLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={authLoading}
            className={styles.submitBtn}
          >
            {authLoading ? <Loader size={18} /> : null}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError('')
          }}
          className={styles.toggleBtn}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  )
}