import { render } from "preact";
import Router from "preact-router";
import { QueryClientProvider } from "@tanstack/preact-query";
import { HomePage } from "@/pages/home/homePage";
import { PresetPage } from "@/pages/preset/presetPage";
import { UserPage } from "@/pages/user/userPage";
import { AuctionPage } from "@/pages/auction/auctionPage";
import { Header } from "@/components/header";
import { queryClient } from "@/utils/queryClient";
import { removeAuthToken } from "@/utils/auth";
import { route } from "preact-router";
import "@/styles/global.css";
import "@/styles/app.css";

function App() {
  return (
    <Router>
      <HomePage path="/" />
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
  route("/");
}

function UserPageWrapper({}: PageWrapperProps) {
  return (
    <div className="app-container">
      <Header currentPage="user" onLogout={handleLogout} />
      <UserPage />
    </div>
  );
}

function PresetPageWrapper({}: PageWrapperProps) {
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
