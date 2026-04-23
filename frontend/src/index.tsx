import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes as RouterRoutes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
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

function DefaultRedirectRoute() {
  return <Navigate to={Routes.home.to} replace />;
}

function TermsOfServiceRoute() {
  return <MarkedPage path="/terms-of-service.md" />;
}

function PrivacyPolicyRoute() {
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
          <BrowserRouter>
            <RouterRoutes>
              <Route
                path={Routes.auth.loginCallback.pattern}
                element={<LoginCallbackPage />}
              />
              <Route path={Routes.home.pattern} element={<HomePage />} />
              <Route path={Routes.patch.pattern} element={<PatchPage />} />
              <Route
                path={Routes.announcement.pattern}
                element={<AnnouncementPage />}
              />
              <Route
                path={Routes.termsOfService.pattern}
                element={<TermsOfServiceRoute />}
              />
              <Route
                path={Routes.privacyPolicy.pattern}
                element={<PrivacyPolicyRoute />}
              />
              <Route
                path={Routes.guild.preset.pattern}
                element={<PresetPage />}
              />
              <Route
                path={Routes.guild.member.pattern}
                element={<MemberPage />}
              />
              <Route
                path={Routes.guild.auction.pattern}
                element={<AuctionPage />}
              />
              <Route path="*" element={<DefaultRedirectRoute />} />
            </RouterRoutes>
          </BrowserRouter>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
