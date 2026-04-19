import { Fill } from "@components/atoms/layout";
import { Link } from "@components/atoms/link";
import { TertiarySection } from "@components/surfaces/section";
import { GUILD_INVITE_URL } from "@utils/env";

export function Footer() {
  return (
    <TertiarySection direction="row">
      <Fill center>
        <Link href="/patch">패치</Link>
      </Fill>
      <Fill center>
        <Link href="/terms-of-service">이용약관</Link>
      </Fill>
      <Fill center>
        <Link href="/privacy-policy">개인정보처리방침</Link>
      </Fill>
      <Fill center>
        <Link href={GUILD_INVITE_URL} target="_blank" rel="noreferrer">
          Trader Bot 길드
        </Link>
      </Fill>
    </TertiarySection>
  );
}
