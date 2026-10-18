import { Link } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <>
      <PageHeader title="Lost in the Stacks">
        This corridor of the library does not lead anywhere.
      </PageHeader>
      <Link to="/" className="font-display text-burgundy-700 underline underline-offset-4 hover:text-burgundy-900">
        Return to the Great Hall
      </Link>
    </>
  )
}

export default NotFound
