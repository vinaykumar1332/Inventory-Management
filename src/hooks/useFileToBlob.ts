import * as React from 'react'

/**
 * Generic hook to convert File to Blob with progress tracking.
 * Reusable for any file upload scenario.
 */
export function useFileToBlob() {
  const [blob, setBlob] = React.useState<Blob | null>(null)
  const [progress, setProgress] = React.useState<number | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const [loading, setLoading] = React.useState(false)

  const convertToBlob = React.useCallback(async (file: File): Promise<Blob | null> => {
    try {
      setLoading(true)
      setError(null)
      setProgress(0)

      return await new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setProgress(percent)
          }
        }

        reader.onload = () => {
          try {
            // Create a blob from the file reader result
            const fileBlob = new Blob([reader.result!], { type: file.type })
            setBlob(fileBlob)
            setProgress(100)
            resolve(fileBlob)
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to create blob')
            setError(error)
            reject(error)
          }
        }

        reader.onerror = () => {
          const error = new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`)
          setError(error)
          reject(error)
        }

        reader.readAsArrayBuffer(file)
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      setBlob(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = React.useCallback(() => {
    setBlob(null)
    setProgress(null)
    setError(null)
  }, [])

  return {
    blob,
    progress,
    error,
    loading,
    convertToBlob,
    clear,
  }
}

/**
 * Simple utility to convert a file to a data URL for preview.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Get file metadata without loading entire content.
 */
export function getFileMetadata(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified),
    extension: file.name.split('.').pop()?.toLowerCase() || '',
  }
}
