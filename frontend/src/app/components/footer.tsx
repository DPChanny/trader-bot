import { Fill } from "@components/atoms/layout";
import { Link } from "@components/atoms/link";
import { PrimarySection } from "@components/surfaces/section";
import { GUILD_INVITE_URL } from "@utils/env";

export function Footer() {
  return (
    <PrimarySection direction="row" width="page">
      <Fill center>
        <Link href="/patch">패치 정보</Link>
      </Fill>
      <Fill center>
        <Link href="/terms-of-service">이용약관</Link>
      </Fill>
      <Fill center>
        <Link href="/privacy-policy">개인정보처리방침</Link>
      </Fill>
      <Fill center>
        <Link href={GUILD_INVITE_URL} target="_blank" rel="noreferrer">
          Trader Bot 서버
        </Link>
      </Fill>
    </PrimarySection>
  );
}
