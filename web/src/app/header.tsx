import styles from "@styles/header.module.css";
import { Button, DangerButton } from "@components/atoms/button";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
import { Link } from "@components/atoms/link";
import { Name, Title } from "@components/atoms/text";
import type { UserDetailDTO } from "@dtos/user";

interface HeaderProps {
  user?: UserDetailDTO;
  onLogout?: () => void;
  onLogin?: () => void;
}

export function Header({ user, onLogout, onLogin }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Row align="center" justify="end" className={styles.headerContent}>
        <Link href="/" variantContent="div" className={styles.headerLogo}>
          <Title>Trader</Title>
        </Link>

        <Row align="center" gap="sm">
          {user ? (
            <>
              {user.avatarUrl && (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  variantContent="avatar"
                  variantSize="medium"
                />
              )}
              <Name>{user.name}</Name>
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
