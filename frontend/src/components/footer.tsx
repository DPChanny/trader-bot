import { Fill } from "@components/atoms/layout";
import { ExternalLink, InternalLink } from "@components/atoms/link";
import { PrimarySection } from "@components/surfaces/section";
import { GUILD_INVITE_URL } from "@utils/env";

export function Footer() {
  return (
    <PrimarySection direction="row" width="page">
      <Fill center>
        <InternalLink href="/patch">패치</InternalLink>
      </Fill>
      <Fill center>
        <InternalLink href="/announcement">공지</InternalLink>
      </Fill>
      <Fill center>
        <InternalLink href="/terms-of-service">이용약관</InternalLink>
      </Fill>
      <Fill center>
        <InternalLink href="/privacy-policy">개인정보처리방침</InternalLink>
      </Fill>
      <Fill center>
        <ExternalLink href={GUILD_INVITE_URL}>Trader Bot 서버</ExternalLink>
      </Fill>
    </PrimarySection>
  );
}
