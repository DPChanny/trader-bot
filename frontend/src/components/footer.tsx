import { Column, Fill, Row } from "@components/atoms/layout";
import { Text } from "@components/atoms/text";
import { ExternalLink, InternalLink } from "@components/atoms/link";
import { PrimarySection } from "@components/surfaces/section";
import { GUILD_INVITE_URL } from "@utils/env";

export function Footer() {
  return (
    <PrimarySection direction="column" width="page" gap="sm">
      <Row>
        <Fill center>
          <InternalLink to="/patch">패치</InternalLink>
        </Fill>
        <Fill center>
          <InternalLink to="/announcement">공지</InternalLink>
        </Fill>
        <Fill center>
          <ExternalLink href={GUILD_INVITE_URL}>공식 Discord 서버</ExternalLink>
        </Fill>
        <Fill center>
          <InternalLink to="/terms-of-service">이용약관</InternalLink>
        </Fill>
        <Fill center>
          <InternalLink to="/privacy-policy">개인정보처리방침</InternalLink>
        </Fill>
      </Row>
      <Column gap="xs">
        <Text variantSize="small" tone="accent">
          상호명: 디피씨 스튜디오 (DPC Studio) · 대표자: 박경찬 · 고객센터: 공식
          Discord 서버
        </Text>
        <Text variantSize="small" tone="accent">
          사업자등록번호: 501-46-92980 · 통신판매업 신고번호:
        </Text>
        <Text variantSize="small" tone="accent">
          주소: 서울특별시 강남구 논현로 213, 104동 202호(도곡동,
          역삼력키아파트)
        </Text>
      </Column>
    </PrimarySection>
  );
}
