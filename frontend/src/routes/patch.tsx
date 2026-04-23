import { createFileRoute } from "@tanstack/react-router";
import { PatchPage } from "@pages/patchPage";

export const Route = createFileRoute("/patch")({
  component: PatchPage,
});
