import { useState, useEffect } from "react";
import { createRootRoute, Outlet, Navigate } from "@tanstack/react-router";
import { Header } from "@components/header";
import { SideMenu } from "@components/sideMenu/sideMenu";
import { Modal, ModalFooter } from "@components/modal";
import { Error } from "@components/molecules/error";
import { PrimaryButton } from "@components/atoms/button";
import { useRefreshToken, useLogin, useLogout } from "@features/auth/hook";
import { useManifest } from "@hooks/public";
import { useMyUser } from "@features/user/hook";
import { AppError, FrontendErrorCode } from "@utils/error";
import { PHASE } from "@utils/env";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => {
    return <Navigate to="/" replace />;
  },
});

function RootComponent() {
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
          <Outlet />
        </div>
      </div>
    </div>
  );
}
