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
  const flowText = `Discord 로그인 → 관리자 권한으로 ${BOT_INVITE_URL_TEXT} → 길드 선택 → 프리셋 구성 → 경매 생성`;
  const setupSteps = [
    {
      title: "1. 로그인과 길드 연결",
      description:
        "길드 오너이거나 관리자 권한이 있는 Discord 계정으로 로그인한 뒤, 사이트에서 사용할 길드에 봇을 초대합니다.",
    },
    {
      title: "2. 프리셋 정리",
      description:
        "경매에 참여할 멤버를 모으고 티어와 포지션을 맞춰, 실제 운영에 맞는 시작 상태를 만들어 둡니다.",
    },
    {
      title: "3. 경매 시작",
      description:
        "준비된 프리셋으로 경매를 열고, 진행 상황과 결과를 한 흐름 안에서 이어서 확인합니다.",
    },
  ];
  const usageCases = [
    {
      title: "내전 준비",
      description:
        "매번 멤버를 다시 적지 않고, 프리셋만 손봐서 바로 다음 경매를 열 수 있습니다.",
    },
    {
      title: "시즌별 운영",
      description:
        "티어 변경이나 포지션 재배치가 생겨도 현재 구성 흐름을 유지하면서 계속 갱신할 수 있습니다.",
    },
    {
      title: "역할 분배 정리",
      description:
        "누가 어떤 포지션 풀에 들어가야 하는지 미리 맞춰 두고, 경매 단계에서 바로 활용할 수 있습니다.",
    },
  ];
  const checklist = [
    "길드 오너이거나 관리자 권한이 있는 계정으로 로그인했는지",
    `${BOT_INVITE_URL_TEXT}를 관리자 권한으로 대상 길드에 초대했는지`,
    "경매에 사용할 멤버와 티어, 포지션이 프리셋에 반영되어 있는지",
    "여러 번 반복할 조합이라면 프리셋을 따로 저장해 두었는지",
  ];

  return (
    <Page>
      <Scroll axis="y">
        <Column gap="xl" width="page" self="center">
          <PrimarySection>
            <Title>Discord 연동으로 팀원 경매를</Title>
            <SecondarySection>
              <Title>하나의 흐름으로</Title>
              <Card>
                <Column gap="md">
                  <Text variantWeight="semibold">{flowText}</Text>
                  <Text>
                    길드를 사용하려면 관리자 또는 길드 오너 계정으로 로그인하고,
                    같은 길드에 봇 초대를 끝내야 합니다. 그 이후에 길드와 멤버
                    정보를 불러와 프리셋과 경매 흐름을 이어갈 수 있습니다.
                  </Text>
                </Column>
              </Card>
            </SecondarySection>
            <SecondarySection>
              <Title>복잡한 등록 없이</Title>
              <Card>
                <Column gap="md">
                  <Text variantWeight="semibold">
                    별도 회원가입 없이 Discord 계정과 길드 권한으로 바로
                    시작합니다.
                  </Text>
                  <Text>
                    별도 회원가입이나 수동 멤버 등록 없이 시작할 수 있지만,
                    사이트에서 길드를 실제로 다루려면 관리자 권한이 있는
                    계정으로 로그인하고 봇을 관리자 권한으로 초대해야 합니다.
                  </Text>
                </Column>
              </Card>
            </SecondarySection>
            <SecondarySection>
              <Title>다양한 조합으로</Title>
              <Card>
                <Column gap="md">
                  <Text variantWeight="semibold">
                    티어, 포지션, 프리셋 조합을 서비스 흐름에 맞게 정리할 수
                    있습니다.
                  </Text>
                  <Text>
                    멤버 구성을 미리 맞춰 두고 경매를 반복해서 열 수 있어서,
                    시즌별 운영이나 내전 준비처럼 자주 바뀌는 조합도 부담 없이
                    관리할 수 있습니다.
                  </Text>
                </Column>
              </Card>
            </SecondarySection>
            <Title>간편하게!</Title>
            <Row gap="md" wrap>
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

          <SecondarySection gap="lg">
            <Title>시작 흐름</Title>
            <Row gap="md" wrap align="stretch">
              {setupSteps.map((step) => (
                <Fill key={step.title}>
                  <Card fill>
                    <Column gap="md" fill>
                      <Text variantWeight="semibold" variantSize="large">
                        {step.title}
                      </Text>
                      <Text>{step.description}</Text>
                    </Column>
                  </Card>
                </Fill>
              ))}
            </Row>
          </SecondarySection>

          <SecondarySection gap="lg">
            <Title>이런 상황에 맞습니다</Title>
            <Row gap="md" wrap align="stretch">
              {usageCases.map((usageCase) => (
                <Fill key={usageCase.title}>
                  <Card fill>
                    <Column gap="md" fill>
                      <Text variantWeight="semibold" variantSize="large">
                        {usageCase.title}
                      </Text>
                      <Text>{usageCase.description}</Text>
                    </Column>
                  </Card>
                </Fill>
              ))}
            </Row>
          </SecondarySection>

          <SecondarySection gap="lg">
            <Title>확인 사항</Title>
            <Card>
              <Column gap="md">
                {checklist.map((item) => (
                  <Text key={item}>{`- ${item}`}</Text>
                ))}
              </Column>
            </Card>
            <Card>
              <Column gap="md">
                <Text variantWeight="semibold">
                  길드 사용 조건이 먼저 충족되어야 합니다.
                </Text>
                <Text>
                  로그인만 해서는 모든 길드가 바로 보이지 않습니다. 관리자 또는
                  길드 오너 권한이 있는 계정으로 접속하고, 해당 길드에 봇 초대를
                  끝낸 뒤에야 사이트에서 그 길드를 이용할 수 있습니다.
                </Text>
              </Column>
            </Card>
          </SecondarySection>

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
