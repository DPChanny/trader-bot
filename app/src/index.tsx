import { render } from "preact";
import Router from "preact-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "@/pages/home/homePage";
import { PresetPage } from "@/pages/preset/presetPage";
import { UserPage } from "@/pages/user/userPage";
import { AuctionPage } from "@/pages/auction/auctionPage";
import { Header } from "@/components/header";
import { queryClient } from "@/lib/queryClient.ts";
import "@/styles/global.css";
import "@/styles/app.css";

function App() {
  return (
    <Router>
      <HomePage path="/" />
      <UserPageWrapper path="/user" />
      <PresetPageWrapper path="/preset" />
      <AuctionPageWrapper path="/auction" />
    </Router>
  );
}

interface PageWrapperProps {
  path?: string;
}

function UserPageWrapper({}: PageWrapperProps) {
  return (
    <div className="app-container">
      <Header currentPage="user" />
      <UserPage />
    </div>
  );
}

function PresetPageWrapper({}: PageWrapperProps) {
  return (
    <div className="app-container">
      <Header currentPage="preset" />
      <PresetPage />
    </div>
  );
}

function AuctionPageWrapper({}: PageWrapperProps) {
  return <AuctionPage />;
}

render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  document.getElementById("app")!
);
