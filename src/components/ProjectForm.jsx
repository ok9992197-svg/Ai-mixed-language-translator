import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Loader } from 'lucide-react'
import styles from './ProjectForm.module.css'

export function ProjectForm({ onProjectCreate, disabled }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [languagePair, setLanguagePair] = useState('')
  const [pairs, setPairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLanguagePairs()
  }, [])

  const fetchLanguagePairs = async () => {
    try {
      const { data, error } = await supabase
        .from('language_pairs')
        .select('*')
        .eq('is_active', true)

      if (error) throw error
      setPairs(data || [])
      if (data && data.length > 0) {
        setLanguagePair(data[0].id)
      }
    } catch (err) {
      setError('Failed to load language pairs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('translation_projects')
        .insert({
          user_id: user.id,
          language_pair_id: languagePair,
          title,
          description
        })
        .select()
        .single()

      if (error) throw error

      onProjectCreate(data)
      setTitle('')
      setDescription('')
    } catch (err) {
      setError(err.message || 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader size={24} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2>Create New Project</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Project Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Movie Subtitles"
            required
            disabled={disabled || submitting}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows="3"
            disabled={disabled || submitting}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="language-pair">Language Pair</label>
          <select
            id="language-pair"
            value={languagePair}
            onChange={(e) => setLanguagePair(e.target.value)}
            disabled={disabled || submitting || pairs.length === 0}
          >
            {pairs.map((pair) => (
              <option key={pair.id} value={pair.id}>
                {pair.display_name} - {pair.description}
              </option>
            ))}
          </select>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={disabled || submitting || !title || pairs.length === 0}
          className={styles.submitBtn}
        >
          {submitting ? <Loader size={18} /> : <Plus size={18} />}
          Create Project
        </button>
      </form>
    </div>
  )
}