import { createFileRoute } from "@tanstack/react-router";
import { MarkedPage } from "@pages/markedPage";
import { markedQueryOptions } from "@hooks/public";

export const Route = createFileRoute("/privacy-policy")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.ensureQueryData(markedQueryOptions("/privacy-policy.md"));
  },
  component: () => <MarkedPage path="/privacy-policy.md" />,
});
