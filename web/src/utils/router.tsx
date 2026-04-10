import { useEffect } from "preact/hooks";
import Router, { route } from "preact-router";
import { GuildPage } from "@/pages/guild/guildPage";
import { HomePage } from "@/pages/home/homePage";
import { AuctionPage } from "@/pages/auction/auctionPage";
import { isAuthenticated, setAuthToken, setRefreshToken } from "@/utils/auth";
import { queryClient } from "@/utils/query";

function useAuthGuard() {
  useEffect(() => {
    if (!isAuthenticated()) route("/", true);
  }, []);
}

function RootRoute({}: { path?: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refresh_token");
    if (token) setAuthToken(token);
    if (refreshToken) setRefreshToken(refreshToken);
    if (token || refreshToken) {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      route("/", true);
    }
  }, []);

  return <HomePage />;
}

function GuildPresetRoute({
  guildId,
  presetId,
}: {
  path?: string;
  guildId?: string;
  presetId?: string;
}) {
  useAuthGuard();
  if (!isAuthenticated() || !guildId) return null;
  return (
    <GuildPage
      guildId={guildId}
      editor="preset"
      presetId={presetId ? parseInt(presetId, 10) : null}
    />
  );
}

function GuildMemberRoute({ guildId }: { path?: string; guildId?: string }) {
  useAuthGuard();
  if (!isAuthenticated() || !guildId) return null;
  return <GuildPage guildId={guildId} editor="member" presetId={null} />;
}

function AuctionRoute({ auctionId }: { path?: string; auctionId?: string }) {
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
      <RootRoute path="/" />
      <GuildPresetRoute path="/guild/:guildId/preset/:presetId" />
      <GuildMemberRoute path="/guild/:guildId/member" />
      <AuctionRoute path="/auction/:auctionId" />
    </Router>
  );
}
