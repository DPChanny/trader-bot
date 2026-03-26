import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import styles from "@/styles/pages/home/homePage.module.css";
import {
  isAuthenticated,
  removeAuthToken,
  refreshAuthToken,
} from "@/utils/auth";
import { useDiscordLogin } from "@/hooks/auth";
import { SecondaryButton, PrimaryButton } from "@/components/button";

interface HomeProps {
  path?: string;
}

export function HomePage({}: HomeProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const discordLogin = useDiscordLogin();

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

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
  };

  return (
    <div class={styles.homeContainer}>
      <h1 class={styles.homeTitle}>창식이 내전</h1>

      {!isLoggedIn && (
        <div class={styles.loginContainer}>
          <PrimaryButton onClick={discordLogin}>Discord로 로그인</PrimaryButton>
        </div>
      )}

      {isLoggedIn && (
        <>
          <div class={styles.logoutContainer}>
            <SecondaryButton onClick={handleLogout}>로그아웃</SecondaryButton>
          </div>
          <div class={styles.homeButtons}>
            <button
              class={styles.homeBtn}
              onClick={() => handleNavigate("/user")}
            >
              <div class={styles.btnIcon}>👤</div>
              <div class={styles.btnText}>유저 관리</div>
              <div class={styles.btnDescription}>유저 추가, 수정, 삭제</div>
            </button>
            <button
              class={styles.homeBtn}
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
