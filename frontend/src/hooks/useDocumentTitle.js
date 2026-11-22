import { useEffect } from 'react'

// Sets the page <title> and meta description for SEO.
export default function useDocumentTitle(title, description) {
  useEffect(() => {
    document.title = title
    if (description) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = description
    }
  }, [title, description])
}
