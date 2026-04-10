import { render } from "preact";
import { useEffect } from "preact/hooks";
import Router from "preact-router";
import { QueryClientProvider } from "@tanstack/preact-query";
import { GuildPage } from "@/pages/guild/guildPage";
import { HomePage } from "@/pages/home/homePage";
import { AuctionPage } from "@/pages/auction/auctionPage";
import { Header } from "@/components/commons/header";
import { queryClient } from "@/utils/query";
import {
  removeAuthToken,
  removeRefreshToken,
  isAuthenticated,
  setAuthToken,
  setRefreshToken,
} from "@/utils/auth";
import { useAutoRefreshToken, useLogin } from "@/hooks/auth";
import { useMe } from "@/hooks/user";
import { route } from "preact-router";
import "@/styles/app.css";

function handleLogout() {
  removeAuthToken();
  removeRefreshToken();
  route("/");
}

function Root({}: { path?: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refresh_token");
    if (token) setAuthToken(token);
    if (refreshToken) setRefreshToken(refreshToken);
    if (isAuthenticated()) {
      route("/guild", true);
    }
  }, []);

  if (isAuthenticated()) return null;

  return <HomePage />;
}

interface GuildRouteProps {
  path?: string;
  guildId?: string;
}

interface GuildPresetRouteProps extends GuildRouteProps {
  presetId?: string;
}

function GuildBaseRoute({}: GuildRouteProps) {
  useEffect(() => {
    if (!isAuthenticated()) route("/", true);
  }, []);
  if (!isAuthenticated()) return null;
  return <GuildPage guildId={null} editor={null} presetId={null} />;
}

function GuildRoute({ guildId }: GuildRouteProps) {
  useEffect(() => {
    if (!isAuthenticated()) route("/", true);
  }, []);
  if (!isAuthenticated() || !guildId) return null;
  return <GuildPage guildId={guildId} editor={null} presetId={null} />;
}

function GuildPresetRedirect({ guildId }: GuildRouteProps) {
  useEffect(() => {
    if (!isAuthenticated()) route("/", true);
    else route(guildId ? `/guild/${guildId}` : "/guild", true);
  }, [guildId]);
  return null;
}

function GuildPresetRoute({ guildId, presetId }: GuildPresetRouteProps) {
  useEffect(() => {
    if (!isAuthenticated()) route("/", true);
  }, []);
  if (!isAuthenticated() || !guildId) return null;
  return (
    <GuildPage
      guildId={guildId}
      editor="preset"
      presetId={presetId ? parseInt(presetId, 10) : null}
    />
  );
}

function GuildMemberRoute({ guildId }: GuildRouteProps) {
  useEffect(() => {
    if (!isAuthenticated()) route("/", true);
  }, []);
  if (!isAuthenticated() || !guildId) return null;
  return <GuildPage guildId={guildId} editor="member" presetId={null} />;
}

interface AuctionLayoutProps {
  path?: string;
  auctionId?: string;
}

function AuctionLayout({ auctionId }: AuctionLayoutProps) {
  const id = auctionId ? parseInt(auctionId, 10) : undefined;
  return (
    <main className="app-main">
      <AuctionPage auctionId={id} />
    </main>
  );
}

function AppShell() {
  useAutoRefreshToken();
  const { data: user } = useMe();
  const login = useLogin();

  return (
    <div className="app-container">
      <Header
        user={user?.discordUser}
        onLogout={isAuthenticated() ? handleLogout : undefined}
        onLogin={!isAuthenticated() ? login : undefined}
      />
      <div className="app-content">
        <Router>
          <Root path="/" />
          <GuildBaseRoute path="/guild" />
          <GuildRoute path="/guild/:guildId" />
          <GuildPresetRedirect path="/guild/:guildId/preset" />
          <GuildPresetRoute path="/guild/:guildId/preset/:presetId" />
          <GuildMemberRoute path="/guild/:guildId/member" />
          <AuctionLayout path="/auction/:auctionId" />
        </Router>
      </div>
    </div>
  );
}

render(
  <QueryClientProvider client={queryClient}>
    <AppShell />
  </QueryClientProvider>,
  document.getElementById("app")!,
);
