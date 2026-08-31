import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

/**
 * Orchestrates the 3-step presigned-URL upload flow:
 *   1. Get presigned URLs  (phase: 'signing')
 *   2. Upload to S3        (phase: 'uploading')
 *   3. Process on backend  (phase: 'processing')
 *   4. Done                (phase: 'done')
 *
 * @param {Object} opts
 * @param {number} opts.concurrency  Max parallel S3 uploads (default 3)
 */
export function usePresignedUpload({ concurrency = 3 } = {}) {
  const queryClient = useQueryClient()

  const [phase, setPhase] = useState('idle') // idle | signing | uploading | processing | done | error
  const [error, setError] = useState(null)
  const [fileProgress, setFileProgress] = useState(new Map()) // filename -> { progress: 0-1, phase, error }
  const [overallProgress, setOverallProgress] = useState(0)
  const [result, setResult] = useState(null)
  const abortRef = useRef(false)

  const isUploading = phase !== 'idle' && phase !== 'done' && phase !== 'error'

  /**
   * @param {Array<{ file: File, uploadType: string }>} stagedFiles
   *   Each item has a File object and an uploadType ('sped' | 'reinf').
   */
  const startUpload = useCallback(async (stagedFiles) => {
    if (stagedFiles.length === 0) return
    abortRef.current = false
    setError(null)
    setResult(null)

    // Build initial progress map
    const initialProgress = new Map()
    for (const sf of stagedFiles) {
      initialProgress.set(sf.file.name, { progress: 0, phase: 'pending', error: null })
    }
    setFileProgress(new Map(initialProgress))
    setOverallProgress(0)

    const totalSize = stagedFiles.reduce((sum, sf) => sum + sf.file.size, 0)

    // Helper to update a single file's progress and recompute overall
    const updateFileProgress = (filename, updates) => {
      setFileProgress((prev) => {
        const next = new Map(prev)
        const current = next.get(filename) || { progress: 0, phase: 'pending', error: null }
        next.set(filename, { ...current, ...updates })

        // Recompute overall weighted progress
        let weighted = 0
        for (const sf of stagedFiles) {
          const entry = next.get(sf.file.name)
          if (entry) {
            weighted += entry.progress * sf.file.size
          }
        }
        setOverallProgress(totalSize > 0 ? weighted / totalSize : 0)

        return next
      })
    }

    try {
      // ---- Step 1: Get presigned URLs ----
      setPhase('signing')
      for (const sf of stagedFiles) {
        updateFileProgress(sf.file.name, { phase: 'signing' })
      }

      const presignPayload = stagedFiles.map((sf) => ({
        filename: sf.file.name,
        content_type: sf.file.type || 'application/octet-stream',
        file_size: sf.file.size,
        upload_type: sf.uploadType,
      }))

      const presignResult = await api.getPresignedUrls(presignPayload)
      const presignedFiles = presignResult.files

      if (abortRef.current) return

      // ---- Step 2: Upload to S3 with concurrency limit ----
      setPhase('uploading')

      // Build upload queue
      const queue = stagedFiles.map((sf, i) => ({
        file: sf.file,
        presigned: presignedFiles[i],
        uploadType: sf.uploadType,
      }))

      // Process queue with concurrency
      let queueIndex = 0
      const uploadErrors = []

      const worker = async () => {
        while (queueIndex < queue.length) {
          if (abortRef.current) return
          const idx = queueIndex++
          const item = queue[idx]
          if (!item) break

          updateFileProgress(item.file.name, { phase: 'uploading', progress: 0 })

          try {
            await api.uploadToS3(
              item.presigned.presigned_url,
              item.file,
              (progress) => {
                updateFileProgress(item.file.name, { progress })
              }
            )
            updateFileProgress(item.file.name, { progress: 1, phase: 'uploaded' })
          } catch (err) {
            updateFileProgress(item.file.name, { phase: 'error', error: err.message })
            uploadErrors.push(`${item.file.name}: ${err.message}`)
          }
        }
      }

      // Spawn workers
      const workers = []
      for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
        workers.push(worker())
      }
      await Promise.all(workers)

      if (uploadErrors.length > 0) {
        setError(`Upload failed for ${uploadErrors.length} file(s): ${uploadErrors[0]}`)
        setPhase('error')
        return
      }

      if (abortRef.current) return

      // ---- Step 3: Process on backend (one file at a time to avoid API Gateway 29s timeout) ----
      setPhase('processing')
      const allResults = { sped: [], reinf: [] }
      const processErrors = []

      for (const item of queue) {
        if (abortRef.current) return
        updateFileProgress(item.file.name, { phase: 'processing' })

        try {
          const oneResult = await api.processS3Files([{
            s3_key: item.presigned.s3_key,
            filename: item.file.name,
            upload_type: item.uploadType,
          }])
          // Merge results — backend returns objects, not arrays
          if (oneResult.sped) allResults.sped.push(oneResult.sped)
          if (oneResult.reinf) allResults.reinf.push(oneResult.reinf)
          updateFileProgress(item.file.name, { phase: 'done', progress: 1 })
        } catch (err) {
          updateFileProgress(item.file.name, { phase: 'error', error: err.message })
          processErrors.push(`${item.file.name}: ${err.message}`)
        }
      }

      if (processErrors.length > 0 && processErrors.length === queue.length) {
        setError(`Processamento falhou: ${processErrors[0]}`)
        setPhase('error')
        return
      }

      setResult(allResults)
      setPhase('done')

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['spedByCompany'] })
      queryClient.invalidateQueries({ queryKey: ['spedFiles'] })
      queryClient.invalidateQueries({ queryKey: ['reinfByCompany'] })
      queryClient.invalidateQueries({ queryKey: ['reinfFiles'] })
      queryClient.invalidateQueries({ queryKey: ['simplesNacionalFiles'] })
      queryClient.invalidateQueries({ queryKey: ['onboardedCompanies'] })
    } catch (err) {
      setError(err.message || 'Upload failed')
      setPhase('error')
    }
  }, [concurrency, queryClient])

  const reset = useCallback(() => {
    abortRef.current = true
    setPhase('idle')
    setError(null)
    setFileProgress(new Map())
    setOverallProgress(0)
    setResult(null)
  }, [])

  return {
    startUpload,
    reset,
    fileProgress,
    overallProgress,
    phase,
    isUploading,
    error,
    result,
  }
}
