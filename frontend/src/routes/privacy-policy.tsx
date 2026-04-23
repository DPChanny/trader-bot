import { createFileRoute } from "@tanstack/react-router";
import { MarkedPage } from "@pages/markedPage";

export const Route = createFileRoute("/privacy-policy")({
  component: () => <MarkedPage path="/privacy-policy.md" />,
});
