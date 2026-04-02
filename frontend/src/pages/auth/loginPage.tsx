import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { isAuthenticated } from "@/utils/auth";
import { useLogin } from "@/hooks/auth";
import { PrimaryButton } from "@/components/button";
import styles from "@/styles/pages/auth/loginPage.module.css";

interface LoginPageProps {
  path?: string;
}

export function LoginPage({}: LoginPageProps) {
  const discordLogin = useLogin();

  useEffect(() => {
    if (isAuthenticated()) {
      route("/guild", true);
    }
  }, []);

  return (
    <div class={styles.loginContainer}>
      <h1 class={styles.loginTitle}>창식이 내전</h1>
      <p class={styles.loginSubtitle}>Discord 계정으로 로그인하세요</p>
      <PrimaryButton onClick={discordLogin}>Discord로 로그인</PrimaryButton>
    </div>
  );
}
