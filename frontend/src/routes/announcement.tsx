import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementPage } from "@pages/announcementPage";

export const Route = createFileRoute("/announcement")({
  component: AnnouncementPage,
});
