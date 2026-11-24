// Photos / videos the customer adds to an "Other problem" booking.
// Front-end only for now: photos are saved as small previews with the order (localStorage),
// videos only by name and size. With the Django API, upload the real files instead.

export const MAX_FILES = 5
const MB = 1024 * 1024
const MAX_IMAGE = 5 * MB
const MAX_VIDEO = 50 * MB

export const isVideo = (f) => (f.type || '').startsWith('video/')
export const sizeText = (bytes) => (bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

// Adds new files to the list. Returns { files, error } (error is a message for the customer, or '').
export function addFiles(current, incoming) {
  const files = [...current]
  const problems = []
  for (const f of incoming) {
    const video = isVideo(f)
    if (!video && !(f.type || '').startsWith('image/')) { problems.push(`${f.name} is not a photo or video.`); continue }
    if (f.size > (video ? MAX_VIDEO : MAX_IMAGE)) { problems.push(`${f.name} is too big (max ${video ? 50 : 5} MB).`); continue }
    if (files.some((x) => x.name === f.name && x.size === f.size)) continue
    if (files.length >= MAX_FILES) { problems.push(`You can add up to ${MAX_FILES} files.`); break }
    files.push(f)
  }
  return { files, error: problems.join(' ') }
}

// Small JPEG preview of a photo (data URL), so it fits in browser storage.
export function photoPreview(file, max = 480, quality = 0.7) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

// What is saved with the order: [{ name, type, size, preview? }]
export const toStored = (files) =>
  Promise.all(files.map(async (f) => ({
    name: f.name,
    type: f.type,
    size: f.size,
    ...(isVideo(f) ? {} : { preview: await photoPreview(f) }),
  })))
