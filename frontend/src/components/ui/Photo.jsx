import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'

// `product` = product shot on white (phone pictures): same-size grey box, phone centred and fully visible.
// Image with a grey placeholder while loading. If the file is missing it shows the
// design's placeholder (icon + alt text). Put `group` on the parent card for the hover zoom.
export default function Photo({ src, alt, className = '', rounded = 'rounded-[24px]', fit = 'object-cover', product = false }) {
  const [state, setState] = useState('loading') // loading | loaded | error
  return (
    <div className={`relative overflow-hidden ${product ? 'bg-[#F6F7F9] p-1.5' : 'bg-photo'} ${rounded} ${className}`}>
      {state === 'error' ? (
        <div className="grid h-full w-full place-items-center p-4 text-center text-[13px] text-muted">
          <div>
            <ImageIcon size={22} strokeWidth={2} className="mx-auto mb-2" aria-hidden="true" />
            {alt}
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={`h-full w-full ${product ? 'object-contain mix-blend-multiply' : fit} transition duration-500 group-hover:scale-[1.04] ${
            state === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
