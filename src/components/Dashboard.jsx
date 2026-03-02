import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { parseSRT, parseVTT, detectFormat } from '../lib/subtitleParser'
import { ProjectForm } from './ProjectForm'
import { FileUpload } from './FileUpload'
import { SubtitleEditor } from './SubtitleEditor'
import { Loader, Trash2 } from 'lucide-react'
import styles from './Dashboard.module.css'

export function Dashboard() {
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [currentBatch, setCurrentBatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('translation_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      setError('Failed to load projects')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectCreate = (newProject) => {
    setProjects([newProject, ...projects])
    setCurrentProject(newProject)
    setCurrentBatch(null)
  }

  const handleFileUpload = async (file) => {
    if (!currentProject) {
      setError('Please select a project first')
      return
    }

    setError('')
    setUploading(true)

    try {
      const format = detectFormat(file.content)
      const subtitles = format === 'srt'
        ? parseSRT(file.content)
        : parseVTT(file.content)

      const { data: batchData, error: batchError } = await supabase
        .from('subtitle_batches')
        .insert({
          project_id: currentProject.id,
          file_name: file.name,
          file_format: format,
          original_content: file.content,
          total_lines: subtitles.length,
          status: 'pending'
        })
        .select()
        .single()

      if (batchError) throw batchError

      const subtitlesInsert = subtitles.map(sub => ({
        batch_id: batchData.id,
        sequence_number: sub.sequence_number,
        start_time: sub.start_time,
        end_time: sub.end_time,
        original_text: sub.original_text,
        tags: sub.tags || null,
        is_translated: false
      }))

      const { error: subtitlesError } = await supabase
        .from('translated_subtitles')
        .insert(subtitlesInsert)

      if (subtitlesError) throw subtitlesError

      setCurrentBatch(batchData)
    } catch (err) {
      setError(err.message || 'Failed to upload file')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure? This will delete the project and all its data.')) return

    try {
      const { error } = await supabase
        .from('translation_projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      setProjects(projects.filter(p => p.id !== projectId))
      if (currentProject?.id === projectId) {
        setCurrentProject(null)
        setCurrentBatch(null)
      }
    } catch (err) {
      setError('Failed to delete project')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader size={32} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <ProjectForm onProjectCreate={handleProjectCreate} disabled={uploading} />

        {error && <div className={styles.error}>{error}</div>}

        {projects.length === 0 ? (
          <div className={styles.empty}>
            <p>No projects yet. Create one to get started!</p>
          </div>
        ) : (
          <>
            <div className={styles.projectsList}>
              <h3>Your Projects</h3>
              <div className={styles.projects}>
                {projects.map(project => (
                  <div
                    key={project.id}
                    className={`${styles.projectCard} ${currentProject?.id === project.id ? styles.active : ''}`}
                  >
                    <button
                      onClick={() => setCurrentProject(project)}
                      className={styles.projectButton}
                    >
                      <div>
                        <h4>{project.title}</h4>
                        {project.description && <p>{project.description}</p>}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className={styles.deleteBtn}
                      title="Delete project"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {currentProject && (
              <>
                <FileUpload onFileUpload={handleFileUpload} disabled={uploading} />

                {currentBatch && (
                  <SubtitleEditor batch={currentBatch} format={currentBatch.file_format} />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}