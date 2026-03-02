import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Edit2, Save, X, Download, Loader } from 'lucide-react'
import { generateSRT, generateVTT } from '../lib/subtitleParser'
import styles from './SubtitleEditor.module.css'

export function SubtitleEditor({ batch, format }) {
  const [subtitles, setSubtitles] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubtitles()
  }, [batch?.id])

  const fetchSubtitles = async () => {
    if (!batch?.id) return

    try {
      const { data, error } = await supabase
        .from('translated_subtitles')
        .select('*')
        .eq('batch_id', batch.id)
        .order('sequence_number', { ascending: true })

      if (error) throw error
      setSubtitles(data || [])
    } catch (err) {
      setError('Failed to load subtitles')
      console.error(err)
    }
  }

  const updateSubtitle = async (id, field, value) => {
    try {
      const { error } = await supabase
        .from('translated_subtitles')
        .update({ [field]: value })
        .eq('id', id)

      if (error) throw error

      setSubtitles(subs =>
        subs.map(sub =>
          sub.id === id ? { ...sub, [field]: value } : sub
        )
      )
    } catch (err) {
      setError('Failed to update subtitle')
      console.error(err)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const content = format === 'srt'
        ? generateSRT(subtitles)
        : generateVTT(subtitles)

      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
      element.setAttribute('download', `${batch.file_name.split('.')[0]}-translated.${format}`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (err) {
      setError('Failed to download file')
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Edit Translations</h3>
        <button
          onClick={handleDownload}
          disabled={downloading || subtitles.length === 0}
          className={styles.downloadBtn}
          title="Download translated subtitles"
        >
          {downloading ? <Loader size={18} /> : <Download size={18} />}
          Download
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.subtitlesList}>
        {subtitles.map((sub) => (
          <div key={sub.id} className={styles.subtitleItem}>
            <div className={styles.timing}>
              <span className={styles.sequence}>{sub.sequence_number}</span>
              <span className={styles.timecode}>{sub.start_time} → {sub.end_time}</span>
            </div>

            <div className={styles.texts}>
              <div className={styles.textGroup}>
                <label>Original</label>
                <div className={styles.textContent}>{sub.original_text}</div>
              </div>

              <div className={styles.textGroup}>
                <label>Translation</label>
                {editingId === sub.id ? (
                  <textarea
                    value={sub.translated_text || ''}
                    onChange={(e) => updateSubtitle(sub.id, 'translated_text', e.target.value)}
                    className={styles.textarea}
                  />
                ) : (
                  <div className={styles.textContent}>{sub.translated_text || '(No translation yet)'}</div>
                )}
              </div>
            </div>

            <button
              onClick={() => setEditingId(editingId === sub.id ? null : sub.id)}
              className={`${styles.actionBtn} ${editingId === sub.id ? styles.saveBtn : styles.editBtn}`}
              title={editingId === sub.id ? 'Done' : 'Edit translation'}
            >
              {editingId === sub.id ? <Save size={18} /> : <Edit2 size={18} />}
            </button>
          </div>
        ))}
      </div>

      {subtitles.length === 0 && (
        <div className={styles.empty}>
          <p>No subtitles loaded</p>
        </div>
      )}
    </div>
  )
}