import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ImagePlus, Play, Video, X } from 'lucide-react'
import { MAX_FILES, addFiles, isVideo, sizeText } from '../lib/attachments'

// Previews + "Add photo" / "Add video" buttons. Sits inside the bottom of a description box
// (see ProblemBox). files: File[]; onChange(newFiles)
export default function MediaUpload({ files, onChange }) {
  const id = useId()
  const photoInput = useRef(null)
  const videoInput = useRef(null)
  const [error, setError] = useState('')

  // Preview URLs for the chosen files (freed when the list changes)
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])

  const add = (list) => {
    const r = addFiles(files, Array.from(list || []))
    setError(r.error)
    if (r.files.length !== files.length) onChange(r.files)
  }
  const remove = (i) => { setError(''); onChange(files.filter((_, j) => j !== i)) }
  const full = files.length >= MAX_FILES
  const pick = (e) => { add(e.target.files); e.target.value = '' }

  const btn = 'inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white px-3 text-sm sm:flex-none sm:px-4 font-bold text-ink transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-50'

  return (
    <div>
      {files.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2.5" aria-label="Files added">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}`} className="relative size-[76px] overflow-hidden rounded-xl border border-line bg-[#F6F7F9]" title={`${f.name} · ${sizeText(f.size)}`}>
              {isVideo(f)
                ? <>
                    <video src={urls[i]} muted playsInline preload="metadata" className="size-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center" aria-hidden="true"><span className="grid size-7 place-items-center rounded-full bg-black/55 text-white"><Play size={12} fill="currentColor" /></span></span>
                  </>
                : <img src={urls[i]} alt="" className="size-full object-cover" />}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${f.name}`}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-white/90 text-ink shadow-sm hover:text-danger"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input ref={photoInput} type="file" accept="image/*" multiple className="hidden" onChange={pick} tabIndex={-1} aria-hidden="true" />
      <input ref={videoInput} type="file" accept="video/*" className="hidden" onChange={pick} tabIndex={-1} aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} disabled={full} onClick={() => photoInput.current.click()} aria-describedby={`${id}-hint`}>
          <ImagePlus size={16} strokeWidth={2} aria-hidden="true" /> Add photo
        </button>
        <button type="button" className={btn} disabled={full} onClick={() => videoInput.current.click()} aria-describedby={`${id}-hint`}>
          <Video size={16} strokeWidth={2} aria-hidden="true" /> Add video
        </button>
        <span id={`${id}-hint`} className="w-full text-xs text-muted sm:w-auto">
          {full ? `${MAX_FILES} files added (max)` : `Optional · up to ${MAX_FILES} files`}
        </span>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-danger">{error}</p>}
    </div>
  )
}

// Description box with the photo / video buttons inside it, like a message box.
export function ProblemBox({ id, label, hint, note, onNote, files, onFiles, placeholder, className = '' }) {
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="block text-[13px] font-bold text-body">{label}</label>}
      {hint && <p id={`${id}-hint`} className="mt-0.5 text-[13px] leading-relaxed text-muted">{hint}</p>}
      <div className={`${label ? 'mt-2' : ''} rounded-[18px] border border-field bg-white transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent`}>
        <textarea
          id={id}
          value={note}
          onChange={(e) => onNote(e.target.value)}
          rows={3}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="block w-full resize-none rounded-t-[18px] bg-transparent px-4 pb-2 pt-3.5 text-[15px] text-ink outline-none"
        />
        <div className="border-t border-line px-3 py-3">
          <MediaUpload files={files} onChange={onFiles} />
        </div>
      </div>
    </div>
  )
}
