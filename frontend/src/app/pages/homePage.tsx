import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Link } from "@components/atoms/link";
import { Column, Fill, Page, Row, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";
import { Footer } from "@components/footer";
import { useLogin } from "@hooks/auth";
import { useMyUser } from "@hooks/user";
import { BOT_INVITE_URL } from "@utils/env";

export function HomePage() {
  const login = useLogin();
  const myUser = useMyUser();

  const onboardingSections = [
    {
      title: "하나의 흐름으로",
      emphasis:
        "Discord 로그인 → Trader Bot 초대 → 길드 선택 → 프리셋 구성 → 경매 생성",
      description:
        "길드 관리자 계정으로 로그인하고 봇을 초대하면 바로 이어서 사용할 수 있습니다.",
    },
    {
      title: "회원가입 없이",
      emphasis: "별도 회원가입 없이 시작합니다.",
      description: "Discord 로그인과 관리자 권한 초대만 끝나면 됩니다.",
    },
    {
      title: "복잡한 등록 없이",
      emphasis: "템플릿을 매번 처음부터 다시 적지 않아도 됩니다.",
      description:
        "프리셋을 손봐서 같은 흐름으로 바로 다시 사용할 수 있습니다.",
    },
  ];

  const cases = [
    {
      title: "내전 운영",
      description:
        "길드 내전 운영 흐름을 내전 팀원 경매 운영까지 이어갈 수 있습니다.",
    },
    {
      title: "간단한 시작",
      description:
        "간단한 클릭 몇 번으로 프리셋을 구성하고 경매를 시작할 수 있습니다.",
    },
    {
      title: "간단한 반복",
      description:
        "한번 구성한 프리셋을 조금만 수정해 다음 경매에 재사용할 수 있습니다.",
    },
  ];

  const warnings = [
    {
      emphasis:
        "Trader Bot이 길드에 초대되어야 해당 길드가 서비스에 등록됩니다.",
    },
    {
      emphasis: "소유자 역할은 Trader Bot에 의해서만 자동 부여됩니다.",
    },
    {
      emphasis: "길드 관리자 권한이 있는 멤버는 관리자 역할이 자동 부여됩니다.",
      description:
        "길드 관리자 권한이 박탈되면 편집자를 제외하고 열람자 역할이 자동 부여됩니다.",
    },
    {
      emphasis: "일반 멤버는 열람자 역할이 자동 부여됩니다.",
    },
    {
      emphasis:
        "소유자 역할을 제외한 역할은 관리자 역할부터 부여할 수 있습니다.",
    },
    {
      emphasis:
        "편집자 역할부터 길드 멤버 및 프리셋 멤버 정보를 수정할 수 있습니다.",
    },
    {
      emphasis: "관리자 역할부터 프리셋을 구성할 수 있습니다.",
    },
  ];

  return (
    <Page>
      <Scroll axis="y">
        <Column gap="xl" width="page" self="center">
          <PrimarySection>
            <Title>BETA - v0.2.4</Title>
            <Card>
              <img src="banner.jpg" />
            </Card>
          </PrimarySection>

          <PrimarySection>
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
                        Trader Bot 초대
                      </PrimaryButton>
                    ) : (
                      <SecondaryButton variantSize="large">
                        Trader Bot 초대
                      </SecondaryButton>
                    )}
                  </Fill>
                </Link>
              </Fill>
            </Row>
          </PrimarySection>

          <PrimarySection>
            <Title>Discord 연동으로 팀원 경매를</Title>
            {onboardingSections.map((section) => (
              <SecondarySection key={section.title}>
                <Title>{section.title}</Title>
                <Card>
                  <Column gap="md">
                    <Text variantWeight="semibold">{section.emphasis}</Text>
                    <Text>{section.description}</Text>
                  </Column>
                </Card>
              </SecondarySection>
            ))}
            <Title>간편하게!</Title>
          </PrimarySection>

          <SecondarySection gap="lg">
            <Title>이런 상황에 맞습니다</Title>
            <Row gap="md" wrap align="stretch">
              {cases.map((usageCase) => (
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
            <Title>주의 사항</Title>

            {warnings.map((warning) => (
              <Card key={warning.emphasis} variantColor="red">
                <Column gap="md">
                  <Text variantWeight="semibold">{warning.emphasis}</Text>
                  {warning.description && <Text>{warning.description}</Text>}
                </Column>
              </Card>
            ))}
          </SecondarySection>
          <Footer />
        </Column>
      </Scroll>
    </Page>
  );
}
