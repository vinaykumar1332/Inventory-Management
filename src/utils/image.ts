/** Photos are stored inside the mock database, so each one is resized and compressed to fit this limit (characters of the data URL). */
export const MAX_IMAGE_CHARS = 200_000

const MAX_SIDE_PX = 960
const QUALITY_STEPS = [0.8, 0.65, 0.5, 0.35]

export class ImageError extends Error {
  constructor(public readonly key: 'images.notImage' | 'images.tooLarge') {
    super(key)
  }
}

/** Reads a picked image file, scales it down and returns a JPEG data URL under MAX_IMAGE_CHARS. */
export async function imageFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ImageError('images.notImage')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageError('images.notImage')
  // White under the photo, so transparent PNGs do not turn black when saved as JPEG.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  for (const quality of QUALITY_STEPS) {
    const url = canvas.toDataURL('image/jpeg', quality)
    if (url.length <= MAX_IMAGE_CHARS) return url
  }
  throw new ImageError('images.tooLarge')
}
