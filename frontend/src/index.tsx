import { render } from "preact";
import { useEffect } from "preact/hooks";
import Router from "preact-router";
import { QueryClientProvider } from "@tanstack/preact-query";
import { LoginPage } from "@/pages/auth/loginPage";
import { GuildPage } from "@/pages/guild/guildPage";
import { PresetPage } from "@/pages/preset/presetPage";
import { UserPage } from "@/pages/user/userPage";
import { AuctionPage } from "@/pages/auction/auctionPage";
import { Header } from "@/components/header";
import { queryClient } from "@/utils/query";
import { removeAuthToken, isAuthenticated, setAuthToken } from "@/utils/auth";
import { clearGuild } from "@/utils/guild";
import { useAutoRefreshToken } from "@/hooks/auth";
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
      <UserPageWrapper path="/user" />
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
  clearGuild();
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

function UserPageWrapper({}: PageWrapperProps) {
  useAutoRefreshToken();
  return (
    <div className="app-container">
      <Header currentPage="user" onLogout={handleLogout} />
      <UserPage />
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
    <App />
  </QueryClientProvider>,
  document.getElementById("app")!,
);
