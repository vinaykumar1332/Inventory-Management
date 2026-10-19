// Keeps files uploaded during this browser session so "View document" and
// "Download original" work for them. Object URLs are revoked on replace/reset.

const files = new Map<string, { file: File; url: string }>()

export function cacheFile(invoiceId: string, file: File) {
  releaseFile(invoiceId)
  files.set(invoiceId, { file, url: URL.createObjectURL(file) })
}

export function getCachedFile(invoiceId: string) {
  return files.get(invoiceId)
}

export function releaseFile(invoiceId: string) {
  const entry = files.get(invoiceId)
  if (entry) URL.revokeObjectURL(entry.url)
  files.delete(invoiceId)
}

export function releaseAllFiles() {
  for (const id of [...files.keys()]) releaseFile(id)
}
