import { createFileRoute } from "@tanstack/react-router";
import { AuctionPage } from "@pages/auctionPage/auctionPage";

export const Route = createFileRoute("/guild/$guildId/preset/$presetId/auction/$auctionId")({
  component: AuctionPage,
});
