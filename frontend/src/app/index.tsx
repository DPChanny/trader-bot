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
import { MarkedPage } from "@components/markedPage";
import { Header } from "./header";
import { SideMenu } from "./sideMenu/sideMenu";
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
} from "@hooks/auth";
import { useMyUser } from "@hooks/user";
import { queryClient } from "@utils/query";
import { AppError, FrontendErrorCode } from "@utils/error";
import "@styles/app.css";

function HomeRoute({}: RoutableProps) {
  return <HomePage />;
}

function TermsOfServiceRoute({}: RoutableProps) {
  return <MarkedPage path="/src/docs/legals/termsOfService.md" />;
}

function PrivacyPolicyRoute({}: RoutableProps) {
  return <MarkedPage path="/src/docs/legals/privacyPolicy.md" />;
}

function DefaultRoute({}: RoutableProps) {
  useEffect(() => {
    route("/", true);
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
  const [globalError, setGlobalError] = useState<AppError | null>(null);

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
        <Header user={myUser.data} onLogout={handleLogout} />
      ) : (
        <Header onLogin={login} />
      )}
      <div className="app-body">
        {myUser.data && <SideMenu />}
        <div className="app-content">
          <Router>
            <LoginCallbackRoute path="/auth/login/callback" />
            <HomeRoute path="/" />
            <TermsOfServiceRoute path="/terms-of-service" />
            <PrivacyPolicyRoute path="/privacy-policy" />
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
