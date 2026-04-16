import { useEffect } from "preact/hooks";
import { render } from "preact";
import Router, { route } from "preact-router";
import type { RoutableProps } from "preact-router";
import { QueryClientProvider } from "@tanstack/preact-query";
import { MemberPage } from "@pages/memberPage/memberPage";
import { PresetPage } from "@pages/presetPage/presetPage";
import { HomePage } from "@pages/homePage/homePage";
import { AuctionPage } from "@pages/auctionPage/auctionPage";
import { Header } from "./header";
import { SideMenu } from "./sideMenu/sideMenu";
import {
  useRefreshToken,
  useLogin,
  useLoginCallback,
  useLogout,
  useAuthGuard,
} from "@hooks/auth";
import { useMyUser } from "@hooks/user";
import { queryClient } from "@utils/query";
import "@styles/app.css";

function RootRoute({}: RoutableProps) {
  return <HomePage />;
}

function DefaultRoute({}: RoutableProps) {
  useEffect(() => {
    route("/", true);
  }, []);
  return null;
}

function LoginCallbackRoute({}: RoutableProps) {
  useLoginCallback();
  return null;
}

function MemberRoute({ guildId }: RoutableProps & { guildId?: string }) {
  useAuthGuard();

  if (!guildId) {
    route("/", true);
    return null;
  }

  return <MemberPage />;
}

function PresetRoute({
  guildId,
  presetId,
}: RoutableProps & { guildId?: string; presetId?: string }) {
  useAuthGuard();

  if (!guildId || !presetId) {
    route("/", true);
    return null;
  }

  return <PresetPage />;
}

function AuctionRoute({ auctionId }: RoutableProps & { auctionId?: string }) {
  if (!auctionId) {
    route("/", true);
    return null;
  }

  return <AuctionPage />;
}

function App() {
  useRefreshToken();
  const myUser = useMyUser();
  const login = useLogin();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <div className="app-container">
      {myUser.data ? (
        <Header user={myUser.data} onLogout={handleLogout} />
      ) : (
        <Header onLogin={login} />
      )}
      <div className="app-body">
        {myUser.data && <SideMenu />}
        <div className="app-content">
          <Router>
            <LoginCallbackRoute path="/auth/login/callback" />
            <RootRoute path="/" />
            <PresetRoute path="/guild/:guildId/preset/:presetId" />
            <MemberRoute path="/guild/:guildId/member" />
            <AuctionRoute path="/auction/:auctionId" />
            <DefaultRoute default />
          </Router>
        </div>
      </div>
    </div>
  );
}

render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  document.getElementById("app")!,
);
