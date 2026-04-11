import { useEffect } from "preact/hooks";
import Router, { route } from "preact-router";
import type { RoutableProps } from "preact-router";
import { GuildPage } from "@/pages/guild/guildPage";
import { HomePage } from "@/pages/home/homePage";
import { AuctionPage } from "@/pages/auction/auctionPage";
import { useLoginCallback } from "@/hooks/auth";
import { isAuthenticated } from "@/utils/auth";

function RootRoute({}: RoutableProps) {
  return <HomePage />;
}

function LoginCallbackRoute({}: RoutableProps) {
  useLoginCallback();

  return null;
}

function GuildRoute({ guildId }: RoutableProps & { guildId?: string }) {
  useEffect(() => {
    if (!isAuthenticated()) route("/", true);
  }, []);

  if (!guildId) {
    route("/", true);
    return null;
  }

  return <GuildPage />;
}

function AuctionRoute({ auctionId }: RoutableProps & { auctionId?: string }) {
  return (
    <main className="app-main">
      <AuctionPage
        auctionId={auctionId ? parseInt(auctionId, 10) : undefined}
      />
    </main>
  );
}

export function AppRouter() {
  return (
    <Router>
      <LoginCallbackRoute path="/auth/callback" />
      <RootRoute path="/" />
      <GuildRoute path="/guild/:guildId/preset/:presetId" />
      <GuildRoute path="/guild/:guildId/member" />
      <AuctionRoute path="/auction/:auctionId" />
    </Router>
  );
}
