import styles from "@/styles/components/header.module.css";
import { Button, DangerButton } from "@/components/commons/button";
import { Row } from "@/components/commons/layout";
import { Link } from "@/components/commons/link";
import type { UserDetailDTO } from "@/dtos/user";

interface HeaderProps {
  user?: UserDetailDTO;
  onLogout?: () => void;
  onLogin?: () => void;
}

export function Header({ user, onLogout, onLogin }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Row align="center" justify="end" className={styles.headerContent}>
        <Link href="/" variantStyle="plain" className={styles.headerLogo}>
          <span className={styles.headerIcon}>🎮</span>
          <span className={styles.headerText}>Trader</span>
        </Link>

        <Row align="center" className={styles.headerUser}>
          {user ? (
            <>
              {user.avatarUrl && (
                <img
                  className={styles.userAvatar}
                  src={user.avatarUrl}
                  alt={user.name}
                />
              )}
              <span className={styles.userName}>{user.name}</span>
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
        </Row>
      </Row>
    </header>
  );
}
