import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Link } from "@components/atoms/link";
import { Column, Fill, Page, Row, Scroll } from "@components/atoms/layout";
import { Text } from "@components/atoms/text";
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
            <SecondarySection>
              <Card>
                <Text variantWeight="semibold">
                  {`${BOT_INVITE_URL_TEXT} → 길드 선택 → 프리셋 구성 → 경매 생성을 하나의 흐름으로`}
                </Text>
              </Card>
              <Text>
                {`Discord 계정으로 로그인하고 ${BOT_INVITE_URL_TEXT}를 진행합니다.`}
              </Text>
              <Text>
                운영할 길드를 선택하고 멤버 정보와 운영용 설정을 확인한 뒤
                프리셋을 구성합니다.
              </Text>
              <Text>
                공개 여부와 초대 전송 여부를 선택해 경매를 생성합니다.
              </Text>
            </SecondarySection>
            <Row>
              {myUser.data ? null : (
                <Fill>
                  <PrimaryButton variantSize="large" onClick={login}>
                    로그인하여 시작하기
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
