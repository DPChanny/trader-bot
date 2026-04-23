import { createFileRoute } from "@tanstack/react-router";
import { MarkedPage } from "@pages/markedPage";

export const Route = createFileRoute("/terms-of-service")({
  component: () => <MarkedPage path="/terms-of-service.md" />,
});
