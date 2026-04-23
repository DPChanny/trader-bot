import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { ExternalLink } from "@components/atoms/link";
import { Column, Fill, Page, Row, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Footer } from "@components/footer";
import { AnnouncementList } from "@components/announcementList";
import { useLogin } from "@features/auth/hook";
import { useMyUser } from "@features/user/hook";
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

  return (
    <Page>
      <Column align="center" fill>
        <PrimarySection width="page" minSize>
          <Scroll>
            <SecondarySection>
              <img src="/banner.png" alt="Trader Bot" />
            </SecondarySection>
            <SecondarySection gap="lg">
              <Title>공지</Title>
              <AnnouncementList />
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
                  <ExternalLink href={BOT_INVITE_URL}>
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
                  </ExternalLink>
                </Fill>
              </Row>
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
          </Scroll>
        </PrimarySection>
        <Footer />
      </Column>
    </Page>
  );
}
