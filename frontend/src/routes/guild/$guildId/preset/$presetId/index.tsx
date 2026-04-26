import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/guild/$guildId/preset/$presetId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/guild/$guildId/preset/$presetId/"!</div>
}
