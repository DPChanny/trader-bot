import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Link } from "@components/atoms/link";
import { Column, Fill, Page, Row, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
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
        "Discord 로그인 → Trader Bot 초대 → 서버 선택 → 프리셋 구성 → 경매 생성",
    },
    {
      title: "회원가입 없이",
      emphasis: "Discord 로그인만으로 별도 회원가입 없이 시작합니다.",
    },
    {
      title: "복잡한 등록 없이",
      emphasis:
        "Trader Bot을 서버에 초대하면 서버가 자동으로 서비스에 등록됩니다.",
    },
  ];

  const cases = [
    {
      title: "간단한 운영",
      description:
        "내전 운영에서 팀원 경매 운영까지 흐름을 이어갈 수 있습니다.",
    },
    {
      title: "간단한 시작",
      description:
        "단순한 클릭으로 프리셋을 구성하고 경매를 시작할 수 있습니다.",
    },
    {
      title: "간단한 반복",
      description: "프리셋을 조금만 수정해 다음 경매에 재사용할 수 있습니다.",
    },
  ];

  const warnings = [
    {
      emphasis:
        "Trader Bot이 서버에 초대되어야 해당 서버가 서비스에 등록됩니다.",
    },
    {
      emphasis: "소유자 역할은 Trader Bot이 자동으로 관리합니다.",
    },
    {
      emphasis:
        "서버 관리자 권한이 있는 멤버에게는 관리자 역할이 자동 부여됩니다.",
      description:
        "서버 관리자 권한을 잃으면 편집자를 제외한 멤버에게 열람자 역할이 자동 부여됩니다.",
    },
    {
      emphasis: "일반 멤버에게는 열람자 역할이 자동 부여됩니다.",
    },
    {
      emphasis:
        "소유자 역할을 제외한 역할은 관리자 역할부터 부여할 수 있습니다.",
    },
    {
      emphasis:
        "편집자 역할부터 서버 멤버 및 프리셋 멤버 정보를 수정할 수 있습니다.",
    },
    {
      emphasis: "관리자 역할부터 프리셋을 구성할 수 있습니다.",
    },
  ];

  return (
    <Page>
      <Column align="center" fill>
        <PrimarySection width="page" minSize>
          <Scroll>
            <SecondarySection>
              <img src="/banner.png" alt="Trader Bot" />
            </SecondarySection>
            <SecondarySection>
              <Title>Discord 서버 내전 팀원 경매를</Title>
              {onboardingSections.map((section) => (
                <TertiarySection key={section.title}>
                  <Title>{section.title}</Title>
                  <Card>
                    <Column gap="md">
                      <Text variantWeight="semibold">{section.emphasis}</Text>
                    </Column>
                  </Card>
                </TertiarySection>
              ))}
              <Title>간단하게 운영하세요!</Title>
            </SecondarySection>

            <SecondarySection>
              <Row>
                {myUser.data ? null : (
                  <Fill>
                    <PrimaryButton variantSize="large" onClick={login}>
                      Discord 로그인하여 시작하기
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
            </SecondarySection>

            <SecondarySection gap="lg">
              <Row>
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
          </Scroll>
        </PrimarySection>
        <Footer />
      </Column>
    </Page>
  );
}
