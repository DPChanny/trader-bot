import { render } from "preact";
import { QueryClientProvider } from "@tanstack/preact-query";
import { AppRouter } from "@/utils/router";
import { Header } from "@/components/header";
import { SideMenu } from "@/components/sideMenu/sideMenu";
import { queryClient } from "@/utils/query";
import { useAutoRefreshToken, useLogin, useLogout } from "@/hooks/auth";
import { useMe } from "@/hooks/user";
import "@/styles/app.css";

function App() {
  useAutoRefreshToken();
  const { data: user } = useMe();
  const login = useLogin();
  const logout = useLogout();

  return (
    <div className="app-container">
      <Header
        user={user ?? undefined}
        onLogout={user ? logout : undefined}
        onLogin={!user ? login : undefined}
      />
      <div className="app-body">
        {user && <SideMenu />}
        <div className="app-content">
          <AppRouter />
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
