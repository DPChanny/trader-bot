import styles from "@styles/header.module.css";
import { Button, DangerButton } from "@components/atoms/button";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
import { Link } from "@components/atoms/link";
import { Name, Title } from "@components/atoms/text";
import type { UserDetailDTO } from "@dtos/user";

type HeaderGuestProps = {
  user?: undefined;
  onLogin: () => void;
  onLogout?: never;
};

type HeaderUserProps = {
  user: UserDetailDTO;
  onLogout: () => void;
  onLogin?: never;
};

type HeaderProps = HeaderGuestProps | HeaderUserProps;

export function Header(props: HeaderProps) {
  return (
    <header className={styles.header}>
      <Row align="center" justify="end" className={styles.headerContent}>
        <Link href="/" className={styles.headerLogo}>
          <img src="/icon.jpg" alt="Trader Bot" className={styles.logoIcon} />
          <Title>Trader Bot</Title>
        </Link>

        {props.user ? (
          <Row align="center" gap="lg">
            <Row align="center" gap="sm">
              <Image
                src={props.user.avatarUrl}
                alt={props.user.name}
                variantContent="avatar"
              />
              <Name>{props.user.name}</Name>
            </Row>
            <DangerButton variantSize="small" onClick={props.onLogout}>
              로그아웃
            </DangerButton>
          </Row>
        ) : (
          <Button
            variantIntent="primary"
            variantSize="small"
            onClick={props.onLogin}
          >
            로그인
          </Button>
        )}
      </Row>
    </header>
  );
}
