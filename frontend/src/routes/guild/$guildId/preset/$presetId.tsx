import { createFileRoute } from "@tanstack/react-router";
import { PresetPage } from "@pages/presetPage/presetPage";

export const Route = createFileRoute("/guild/$guildId/preset/$presetId")({
  component: PresetPage,
});
