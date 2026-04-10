import { render } from "preact";
import { QueryClientProvider } from "@tanstack/preact-query";
import { AppRouter } from "@/utils/router";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar/sidebar";
import { queryClient } from "@/utils/query";
import { removeAuthToken, removeRefreshToken } from "@/utils/auth";
import { useAutoRefreshToken, useLogin } from "@/hooks/auth";
import { useMe } from "@/hooks/user";
import { route } from "preact-router";
import "@/styles/app.css";

function AppShell() {
  useAutoRefreshToken();
  const { data: user } = useMe();
  const login = useLogin();

  function handleLogout() {
    removeAuthToken();
    removeRefreshToken();
    queryClient.invalidateQueries({ queryKey: ["me"] });
    route("/");
  }

  return (
    <div className="app-container">
      <Header
        user={user ?? undefined}
        onLogout={user ? handleLogout : undefined}
        onLogin={!user ? login : undefined}
      />
      <div className="app-body">
        {user && <Sidebar />}
        <div className="app-content">
          <AppRouter />
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
