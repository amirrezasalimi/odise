import { createFileRoute } from '@tanstack/react-router'
import Notebook from '@/modules/notebook'

export const Route = createFileRoute('/notebook/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <Notebook notebookId={id} />
}
