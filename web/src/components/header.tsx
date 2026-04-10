import { route } from "preact-router";
import styles from "@/styles/components/header.module.css";
import { Button, DangerButton } from "@/components/commons/button";
import type { UserDetailDTO } from "@/dtos/userDto";

interface HeaderProps {
  user?: UserDetailDTO;
  onLogout?: () => void;
  onLogin?: () => void;
}

export function Header({ user, onLogout, onLogin }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <button
          type="button"
          className={styles.headerLogo}
          onClick={() => route("/")}
        >
          <span className={styles.headerIcon}>🎮</span>
          <span className={styles.headerText}>Trader</span>
        </button>

        <div className={styles.headerUser}>
          {user ? (
            <>
              {user.discordUser.avatarUrl && (
                <img
                  className={styles.userAvatar}
                  src={user.discordUser.avatarUrl}
                  alt={user.discordUser.name}
                />
              )}
              <span className={styles.userName}>{user.discordUser.name}</span>
              {onLogout && (
                <DangerButton variantSize="small" onClick={onLogout}>
                  로그아웃
                </DangerButton>
              )}
            </>
          ) : (
            onLogin && (
              <Button
                variantIntent="primary"
                variantSize="small"
                onClick={onLogin}
              >
                로그인
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
