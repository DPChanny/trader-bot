import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Link } from "@components/atoms/link";
import { Column, Fill, Page, Row, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/molecules/card";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { useLogin } from "@hooks/auth";
import { useMyUser } from "@hooks/user";
import {
  BOT_INVITE_URL,
  BOT_INVITE_URL_TEXT,
  GUILD_INVITE_URL,
  GUILD_INVITE_URL_TEXT,
} from "@utils/env";

export function HomePage() {
  const login = useLogin();
  const myUser = useMyUser();

  return (
    <Page>
      <Scroll axis="y" center>
        <Column gap="xl" width="page" self="center">
          <PrimarySection>
            <Title> Discord 연동으로 팀원 경매를 간편하게!</Title>
            <SecondarySection>
              <Title>하나의 흐름으로</Title>
              <Card>
                <Text variantWeight="semibold">
                  {`Discord 연동 -> ${BOT_INVITE_URL_TEXT} → 길드 선택 → 프리셋 구성 → 경매 생성`}
                </Text>
              </Card>
            </SecondarySection>
            <SecondarySection>
              <Title></Title>
              <TertiarySection>
                <Text></Text>
              </TertiarySection>
            </SecondarySection>
            <Row>
              {myUser.data ? null : (
                <Fill>
                  <PrimaryButton variantSize="large" onClick={login}>
                    로그인하여 Discord 연동하기
                  </PrimaryButton>
                </Fill>
              )}
              <Fill>
                <Link href={BOT_INVITE_URL} target="_blank" rel="noreferrer">
                  <Fill>
                    {myUser.data ? (
                      <PrimaryButton variantSize="large">
                        {BOT_INVITE_URL_TEXT}
                      </PrimaryButton>
                    ) : (
                      <SecondaryButton variantSize="large">
                        {BOT_INVITE_URL_TEXT}
                      </SecondaryButton>
                    )}
                  </Fill>
                </Link>
              </Fill>
            </Row>
          </PrimarySection>

          <TertiarySection direction="row">
            <Fill center>
              <Link href="/terms">이용약관 보기</Link>
            </Fill>
            <Fill center>
              <Link href="/privacy">개인정보처리방침 보기</Link>
            </Fill>
            <Fill center>
              <Link href={GUILD_INVITE_URL} target="_blank" rel="noreferrer">
                {GUILD_INVITE_URL_TEXT}
              </Link>
            </Fill>
          </TertiarySection>
        </Column>
      </Scroll>
    </Page>
  );
}
