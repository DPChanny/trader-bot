import { createFileRoute } from "@tanstack/react-router";
import { MarkedPage } from "@pages/markedPage";
import { markedQueryOptions } from "@hooks/public";

export const Route = createFileRoute("/terms-of-service")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.ensureQueryData(markedQueryOptions("/terms-of-service.md"));
  },
  component: () => <MarkedPage path="/terms-of-service.md" />,
});
