import { useEffect } from "preact/hooks";
import { useState } from "preact/hooks";
import { render } from "preact";
import Router, { route } from "preact-router";
import type { RoutableProps } from "preact-router";
import { QueryClientProvider } from "@tanstack/preact-query";
import { MemberPage } from "@pages/memberPage/memberPage";
import { PresetPage } from "@pages/presetPage/presetPage";
import { HomePage } from "@pages/homePage";
import { AuctionPage } from "@pages/auctionPage/auctionPage";
import { PatchPage } from "@pages/patchPage";
import { AnnouncementPage } from "@pages/announcementPage";
import { MarkedPage } from "@pages/markedPage";
import { Header } from "@components/header";
import { SideMenu } from "./components/sideMenu/sideMenu";
import { Modal, ModalFooter } from "./components/modal";
import { Error } from "./components/molecules/error";
import { PrimaryButton } from "./components/atoms/button";
import { Column, Fill, Page } from "./components/atoms/layout";
import {
  useRefreshToken,
  useLogin,
  useLoginCallback,
  useLogout,
  useAuthGuard,
} from "@features/auth/hook";
import { useRouteQueryParam } from "@hooks/router";
import { useManifest } from "@hooks/public";
import { useMyUser } from "@features/user/hook";
import { queryClient } from "@utils/query";
import { AppError, FrontendErrorCode } from "@utils/error";
import { getPhase } from "@utils/env";
import { getNotes } from "@hooks/public";
import { Routes } from "@utils/routes";
import "@styles/index.css";

function HomePageRoute({}: RoutableProps) {
  return <HomePage />;
}

function PatchPageRoute({}: RoutableProps) {
  const version =
    useRouteQueryParam("version")
      ?.replace(/^\/+|\/+$/g, "")
      .trim() ?? "";

  return <PatchPage version={version} />;
}

function AnnouncementRoute({}: RoutableProps) {
  const name =
    useRouteQueryParam("name")
      ?.replace(/^\/+|\/+$/g, "")
      .trim() ?? "";

  return <AnnouncementPage name={name} />;
}

function TermsOfServiceRoute({}: RoutableProps) {
  return <MarkedPage path="/terms-of-service.md" />;
}

function PrivacyPolicyRoute({}: RoutableProps) {
  return <MarkedPage path="/privacy-policy.md" />;
}

function DefaultRedirectRoute({}: RoutableProps) {
  useEffect(() => {
    route(Routes.home.to, true);
  }, []);
  return null;
}

function LoginCallbackRoute({}: RoutableProps) {
  const { error, retry } = useLoginCallback();

  if (!error) return null;

  return (
    <Page>
      <Fill center>
        <Column center gap="md">
          <Error error={error}>로그인에 실패했습니다</Error>
          <PrimaryButton onClick={retry}>재시도</PrimaryButton>
        </Column>
      </Fill>
    </Page>
  );
}

function MemberPageRoute({ guildId }: RoutableProps & { guildId?: string }) {
  useAuthGuard();

  if (!guildId) {
    route(Routes.home.to, true);
    return null;
  }

  return <MemberPage />;
}

function PresetPageRoute({
  guildId,
  presetId,
}: RoutableProps & { guildId?: string; presetId?: string }) {
  useAuthGuard();

  if (!guildId || !presetId) {
    route(Routes.home.to, true);
    return null;
  }

  return <PresetPage />;
}

function AuctionPageRoute({
  auctionId,
}: RoutableProps & { auctionId?: string }) {
  if (!auctionId) {
    route(Routes.home.to, true);
    return null;
  }

  return <AuctionPage />;
}

function App() {
  useRefreshToken();
  const myUser = useMyUser();
  const login = useLogin();
  const logout = useLogout();
  const manifest = useManifest();
  const [globalError, setGlobalError] = useState<AppError | null>(null);
  const phase = getPhase();
  const version = getNotes(manifest.data?.files ?? [], phase)[0] ?? "";

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
            <LoginCallbackRoute path={Routes.auth.loginCallback.pattern} />
            <HomePageRoute path={Routes.home.pattern} />
            <PatchPageRoute path={Routes.patch.pattern} />
            <AnnouncementRoute path={Routes.announcement.pattern} />
            <TermsOfServiceRoute path={Routes.termsOfService.pattern} />
            <PrivacyPolicyRoute path={Routes.privacyPolicy.pattern} />
            <PresetPageRoute path={Routes.guild.preset.pattern} />
            <MemberPageRoute path={Routes.guild.member.pattern} />
            <AuctionPageRoute path={Routes.guild.auction.pattern} />
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
