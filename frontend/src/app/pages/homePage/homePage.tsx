import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Link } from "@components/atoms/link";
import { Column, FlexItem, Page, Row, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/molecules/card";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { useLogin } from "@hooks/auth";
import styles from "@styles/pages/homePage.module.css";
import {
  BOT_INVITE_URL,
  BOT_INVITE_URL_TEXT,
  GUILD_INVITE_URL,
  GUILD_INVITE_URL_TEXT,
  SITE_NAME,
} from "@utils/env";

export function HomePage() {
  const login = useLogin();

  return (
    <Page>
      <Scroll axis="y" center>
        <Column gap="xl">
          <PrimarySection gap="lg" className={styles.heroSection}>
            <Column gap="md">
              <header>
                <Column gap="md">
                  <Text
                    variantSize="small"
                    variantWeight="bold"
                    className={styles.eyebrow}
                  >
                    Team Auction with Trader Bot
                  </Text>
                  <h1 className={styles.heroTitle}>
                    {`${SITE_NAME}으로 팀원 경매를 간편하게 운영하세요`}
                  </h1>
                  <Text>
                    Discord 길드 멤버를 바탕으로 프리셋을 구성하고 경매를
                    간편하게 생성하세요
                  </Text>
                </Column>
              </header>
              <Row gap="md" wrap>
                <PrimaryButton variantSize="large" onClick={login}>
                  로그인하여 시작하기
                </PrimaryButton>
                <Link href={BOT_INVITE_URL} target="_blank" rel="noreferrer">
                  <SecondaryButton variantTone="outline" variantSize="large">
                    {BOT_INVITE_URL_TEXT}
                  </SecondaryButton>
                </Link>
              </Row>
            </Column>

            <Row fill>
              <Card fill>
                <Text variantSize="small">핵심 흐름</Text>
                <Text variantWeight="semibold">
                  {`${BOT_INVITE_URL_TEXT} → 길드 선택 → 프리셋 구성 → 경매 생성`}
                </Text>
              </Card>
              <Card fill>
                <Text variantSize="small">운영 길드</Text>
                <Text variantWeight="semibold">
                  <Link
                    href={GUILD_INVITE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {GUILD_INVITE_URL_TEXT}
                  </Link>
                </Text>
              </Card>
            </Row>
          </PrimarySection>

          <SecondarySection gap="md">
            <Title>핵심 기능</Title>
            <Column center>
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
            </Column>
          </SecondarySection>

          <Row align="stretch" gap="md">
            <TertiarySection gap="md" fill>
              <header>
                <Column gap="sm">
                  <Title>법률 문서</Title>
                  <Text>
                    외부 매체 등록과 공개 운영을 위한 기본 문서를 제공합니다.
                  </Text>
                </Column>
              </header>
              <Row gap="md" justify="between">
                <FlexItem>
                  <Link href="/terms">이용약관 보기</Link>
                </FlexItem>
                <FlexItem>
                  <Link href="/privacy">개인정보처리방침 보기</Link>
                </FlexItem>
              </Row>
            </TertiarySection>

            <TertiarySection gap="md" fill>
              <Column gap="sm">
                <Title>운영 길드</Title>
                <Text>
                  점검 공지와 운영 문의는 운영 길드에서 확인할 수 있습니다.
                </Text>
              </Column>
              <Row gap="md" wrap>
                <FlexItem>
                  <Link
                    href={GUILD_INVITE_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {GUILD_INVITE_URL_TEXT}
                  </Link>
                </FlexItem>
              </Row>
            </TertiarySection>
          </Row>
        </Column>
      </Scroll>
    </Page>
  );
}
