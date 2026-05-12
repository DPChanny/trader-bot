import styles from "@styles/components/header.module.css";
import { Button, DangerButton } from "@components/atoms/button";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
import { InternalLink } from "@components/atoms/link";
import { Name, Title } from "@components/atoms/text";
import type { UserDetailDTO } from "@features/user/dto";

type HeaderGuestProps = {
  user?: undefined;
  onLogin: () => void;
  onLogout?: never;
  version?: string;
};

type HeaderUserProps = {
  user: UserDetailDTO;
  onLogout: () => void;
  onLogin?: never;
  version?: string;
};

type HeaderProps = HeaderGuestProps | HeaderUserProps;

export function Header(props: HeaderProps) {
  return (
    <header className={styles.header}>
      <Row align="center" justify="end" className={styles.headerContent}>
        <InternalLink to="/" className={styles.headerLogo}>
          <img
            src="/favicon.png"
            alt="Trader Bot"
            className={styles.logoIcon}
          />
          <Title>Trader Bot{props.version ? ` - ${props.version}` : ""}</Title>
        </InternalLink>

        {props.user ? (
          <Row align="center" gap="lg">
            <InternalLink
              to="/me"
              search={{ authKey: undefined, code: undefined }}
            >
              <Row align="center" gap="sm">
                <Image
                  src={props.user.avatarUrl}
                  alt={props.user.name}
                  variantContent="avatar"
                />
                <Name>{props.user.name}</Name>
              </Row>
            </InternalLink>
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
