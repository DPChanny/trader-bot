import { createFileRoute } from "@tanstack/react-router";
import { PatchPage } from "@pages/patchPage";
import { manifestQueryOptions } from "@hooks/public";

export const Route = createFileRoute("/patch")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.ensureQueryData(manifestQueryOptions());
  },
  component: PatchPage,
});
