import { useEffect } from 'react'

const SITE_NAME = 'Gates of Lexoria'

/** Sets the browser tab / screen-reader page title to "<title> | Gates of Lexoria". */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ${SITE_NAME}`
  }, [title])
}
