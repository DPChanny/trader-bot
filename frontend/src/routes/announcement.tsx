import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementPage } from "@pages/announcementPage";
import { manifestQueryOptions } from "@hooks/public";

export const Route = createFileRoute("/announcement")({
  loader: ({ context: { queryClient } }) => {
    void queryClient.ensureQueryData(manifestQueryOptions());
  },
  component: AnnouncementPage,
});
