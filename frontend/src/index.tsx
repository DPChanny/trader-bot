import { useState, useEffect } from "preact/hooks";
import { render } from "preact";
import Router from "preact-router";
import { QueryClientProvider } from "@tanstack/preact-query";
import { MemberPage } from "@pages/memberPage/memberPage";
import { PresetPage } from "@pages/presetPage/presetPage";
import { HomePage } from "@pages/homePage";
import { AuctionPage } from "@pages/auctionPage/auctionPage";
import { PatchPage } from "@pages/patchPage";
import { AnnouncementPage } from "@pages/announcementPage";
import { MarkedPage } from "@pages/markedPage";
import { LoginCallbackPage } from "@pages/loginCallbackPage";
import { Header } from "@components/header";
import { SideMenu } from "./components/sideMenu/sideMenu";
import { Modal, ModalFooter } from "./components/modal";
import { Error } from "./components/molecules/error";
import { PrimaryButton } from "./components/atoms/button";
import { useRefreshToken, useLogin, useLogout } from "@features/auth/hook";
import { useManifest } from "@hooks/public";
import { useMyUser } from "@features/user/hook";
import { queryClient } from "@utils/query";
import { AppError, FrontendErrorCode } from "@utils/error";
import { PHASE } from "@utils/env";
import { Routes } from "@utils/routes";
import "@styles/index.css";

import { route } from "preact-router";
import type { RoutableProps } from "preact-router";

function DefaultRedirectRoute({}: RoutableProps) {
  useEffect(() => {
    route(Routes.home.to, true);
  }, []);
  return null;
}

function TermsOfServiceRoute({}: RoutableProps) {
  return <MarkedPage path="/terms-of-service.md" />;
}

function PrivacyPolicyRoute({}: RoutableProps) {
  return <MarkedPage path="/privacy-policy.md" />;
}

function App() {
  useRefreshToken();
  const myUser = useMyUser();
  const login = useLogin();
  const logout = useLogout();
  const manifest = useManifest();
  const [globalError, setGlobalError] = useState<AppError | null>(null);
  const version = manifest.data?.patches.notes[PHASE]?.[0]?.version ?? "";

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      const error = event.error;
      setGlobalError(
        error instanceof AppError
          ? error
          : new AppError(FrontendErrorCode.Unexpected.Internal),
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      setGlobalError(
        reason instanceof AppError
          ? reason
          : new AppError(FrontendErrorCode.Unexpected.Internal),
      );
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  const handleLogout = () => {
    logout.mutate();
  };

  const Route = (props: { path: string; page: any }) => {
    const Page = props.page;
    return <Page {...props} />;
  };

  return (
    <div className="app-container">
      {globalError && (
        <Modal title="오류" onClose={() => setGlobalError(null)}>
          <Error error={globalError}>예기치 못한 오류가 발생했습니다</Error>
          <ModalFooter>
            <PrimaryButton onClick={() => setGlobalError(null)}>
              확인
            </PrimaryButton>
          </ModalFooter>
        </Modal>
      )}
      {myUser.data ? (
        <Header user={myUser.data} onLogout={handleLogout} version={version} />
      ) : (
        <Header onLogin={login} version={version} />
      )}
      <div className="app-body">
        {myUser.data && <SideMenu />}
        <div className="app-content">
          <Router>
            <Route
              path={Routes.auth.loginCallback.pattern}
              page={LoginCallbackPage}
            />
            <Route path={Routes.home.pattern} page={HomePage} />
            <Route path={Routes.patch.pattern} page={PatchPage} />
            <Route path={Routes.announcement.pattern} page={AnnouncementPage} />
            <TermsOfServiceRoute path={Routes.termsOfService.pattern} />
            <PrivacyPolicyRoute path={Routes.privacyPolicy.pattern} />
            <Route path={Routes.guild.preset.pattern} page={PresetPage} />
            <Route path={Routes.guild.member.pattern} page={MemberPage} />
            <Route path={Routes.guild.auction.pattern} page={AuctionPage} />
            <DefaultRedirectRoute default />
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
