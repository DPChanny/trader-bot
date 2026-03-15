import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import styles from "@/styles/pages/home/homePage.module.css";
import {
  isAuthenticated,
  removeAuthToken,
  refreshAuthToken,
} from "@/utils/auth";
import { useAdminLogin } from "@/hooks/admin";
import { Error } from "@/components/error";
import { SecondaryButton, PrimaryButton } from "@/components/button";
import { LabelInput } from "@/components/labelInput";
import { Modal, ModalForm, ModalFooter } from "@/components/modal";

interface HomeProps {
  path?: string;
}

export function HomePage({}: HomeProps) {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [loginError, setLoginError] = useState<string | null>(null);
  const loginMutation = useAdminLogin();

  const handleNavigate = (path: string) => {
    route(path);
  };

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());

    const refreshInterval = setInterval(
      async () => {
        if (isAuthenticated()) {
          try {
            await refreshAuthToken();
          } catch (error) {
            console.error("Auto token refresh failed:", error);
          }
        }
      },
      30 * 60 * 1000,
    );

    return () => clearInterval(refreshInterval);
  }, []);

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await loginMutation.mutateAsync(password);
      setIsLoggedIn(true);
      setPassword("");
    } catch (err) {
      const error = err as Error;
      setLoginError(error.message || "로그인 실패");
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
  };

  return (
    <div class={styles.homeContainer}>
      <h1 class={styles.homeTitle}>창식이 내전</h1>

      <Modal isOpen={!isLoggedIn} onClose={() => {}} title="관리자 로그인">
        <ModalForm onSubmit={handleLogin}>
          {loginError ? <Error message={loginError} /> : null}
          <LabelInput
            label="비밀번호"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="관리자 비밀번호"
            disabled={loginMutation.isPending}
            autoFocus
          />
          <ModalFooter>
            <PrimaryButton
              type="submit"
              disabled={loginMutation.isPending || !password}
            >
              {loginMutation.isPending ? "로그인 중" : "로그인"}
            </PrimaryButton>
          </ModalFooter>
        </ModalForm>
      </Modal>

      {isLoggedIn && (
        <>
          <div class={styles.logoutContainer}>
            <SecondaryButton onClick={handleLogout}>로그아웃</SecondaryButton>
          </div>
          <div class={styles.homeButtons}>
            <button
              class={`${styles.homeBtn} ${styles.homeBtnUser}`}
              onClick={() => handleNavigate("/user")}
            >
              <div class={styles.btnIcon}>👤</div>
              <div class={styles.btnText}>유저 관리</div>
              <div class={styles.btnDescription}>유저 추가, 수정, 삭제</div>
            </button>
            <button
              class={`${styles.homeBtn} ${styles.homeBtnPreset}`}
              onClick={() => handleNavigate("/preset")}
            >
              <div class={styles.btnIcon}>⚙️</div>
              <div class={styles.btnText}>프리셋 관리</div>
              <div class={styles.btnDescription}>프리셋 추가, 수정, 삭제</div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
