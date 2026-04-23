import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@pages/homePage";

export const Route = createFileRoute("/")({
  component: HomePage,
});
