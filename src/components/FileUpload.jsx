import { useState } from 'react'
import { Upload, AlertCircle } from 'lucide-react'
import styles from './FileUpload.module.css'

export function FileUpload({ onFileUpload, disabled }) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (file) => {
    setError('')

    if (!file.name.endsWith('.srt') && !file.name.endsWith('.vtt')) {
      setError('Only .srt and .vtt files are supported')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      onFileUpload({
        name: file.name,
        content: e.target.result,
        format: file.name.endsWith('.srt') ? 'srt' : 'vtt'
      })
    }
    reader.readAsText(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropZone} ${dragActive ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".srt,.vtt"
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
          id="file-input"
        />

        <label htmlFor="file-input" className={styles.label}>
          <Upload size={32} />
          <h3>Upload Subtitle File</h3>
          <p>Drag and drop your .srt or .vtt file here, or click to browse</p>
          <span className={styles.supported}>Supported: SRT, VTT</span>
        </label>
      </div>

      {error && (
        <div className={styles.error}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}