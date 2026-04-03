import { render } from "preact";
import { useEffect } from "preact/hooks";
import Router from "preact-router";
import { QueryClientProvider } from "@tanstack/preact-query";
import { LoginPage } from "@/pages/auth/loginPage";
import { GuildPage } from "@/pages/guild/guildPage";
import { PresetPage } from "@/pages/preset/presetPage";
import { MemberPage } from "@/pages/member/memberPage";
import { AuctionPage } from "@/pages/auction/auctionPage";
import { Header } from "@/components/commons/header";
import { queryClient } from "@/utils/query";
import { removeAuthToken, isAuthenticated, setAuthToken } from "@/utils/auth";
import { useAutoRefreshToken } from "@/hooks/auth";
import { GuildProvider } from "@/contexts/guildContext";
import { route } from "preact-router";
import "@/styles/app.css";

function Root({}: { path?: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setAuthToken(token);
    }
    route(isAuthenticated() ? "/guild" : "/auth/login", true);
  }, []);
  return null;
}

function App() {
  return (
    <Router>
      <Root path="/" />
      <LoginPage path="/auth/login" />
      <GuildPageWrapper path="/guild" />
      <MemberPageWrapper path="/member" />
      <PresetPageWrapper path="/preset" />
      <AuctionPage path="/auction" />
    </Router>
  );
}

interface PageWrapperProps {
  path?: string;
}

function handleLogout() {
  removeAuthToken();
  // GuildProvider clears sessionStorage on mount; guild state resets on reload
  sessionStorage.removeItem("guild");
  route("/");
}

function GuildPageWrapper({}: PageWrapperProps) {
  useAutoRefreshToken();
  return (
    <div className="app-container">
      <Header currentPage="guild" onLogout={handleLogout} />
      <GuildPage />
    </div>
  );
}

function MemberPageWrapper({}: PageWrapperProps) {
  useAutoRefreshToken();
  return (
    <div className="app-container">
      <Header currentPage="member" onLogout={handleLogout} />
      <MemberPage />
    </div>
  );
}

function PresetPageWrapper({}: PageWrapperProps) {
  useAutoRefreshToken();
  return (
    <div className="app-container">
      <Header currentPage="preset" onLogout={handleLogout} />
      <PresetPage />
    </div>
  );
}

render(
  <QueryClientProvider client={queryClient}>
    <GuildProvider>
      <App />
    </GuildProvider>
  </QueryClientProvider>,
  document.getElementById("app")!,
);
