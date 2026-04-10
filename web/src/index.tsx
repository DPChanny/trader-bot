import { render } from "preact";
import { useEffect } from "preact/hooks";
import Router from "preact-router";
import { QueryClientProvider } from "@tanstack/preact-query";
import { GuildPage } from "@/pages/guild/guildPage";
import { AuctionPage } from "@/pages/auction/auctionPage";
import { Header } from "@/components/commons/header";
import { Sidebar } from "@/components/sidebar/sidebar";
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

// ── 홈 / 루트 ──────────────────────────────────────────────────────────────
function Root({}: { path?: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refresh_token");
    if (token) setAuthToken(token);
    if (refreshToken) setRefreshToken(refreshToken);
  }, []);

  if (isAuthenticated()) return null;

  return (
    <main className="app-main app-home">
      <p>Discord 계정으로 로그인하여 이용해주세요.</p>
    </main>
  );
}

// ── GuildPage 라우트 래퍼 ────────────────────────────────────────────────────
interface GuildPresetRouteProps {
  path?: string;
  guildId?: string;
  presetId?: string;
}

function GuildPresetRoute({ guildId, presetId }: GuildPresetRouteProps) {
  if (!guildId) return null;
  return (
    <GuildPage
      guildId={guildId}
      subPage="preset"
      presetId={presetId ? parseInt(presetId, 10) : null}
    />
  );
}

interface GuildMemberRouteProps {
  path?: string;
  guildId?: string;
}

function GuildMemberRoute({ guildId }: GuildMemberRouteProps) {
  if (!guildId) return null;
  return <GuildPage guildId={guildId} subPage="member" presetId={null} />;
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

// ── AppShell ─────────────────────────────────────────────────────────────────
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
      <div className="app-body">
        <Sidebar />
        <div className="app-content">
          <Router>
            <Root path="/" />
            <GuildPresetRoute path="/guild/:guildId/preset" />
            <GuildPresetRoute path="/guild/:guildId/preset/:presetId" />
            <GuildMemberRoute path="/guild/:guildId/member" />
            <AuctionLayout path="/auction/:auctionId" />
          </Router>
        </div>
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
