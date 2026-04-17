import { Button } from "@components/atoms/button";
import { Link } from "@components/atoms/link";
import { ContentList } from "@components/molecules/contentList";
import { InfoPage } from "@components/molecules/infoPage";
import { MetricList } from "@components/molecules/metricList";
import { PageHero } from "@components/molecules/pageHero";
import { PageSection } from "@components/molecules/pageSection";
import { SecondaryActionLink } from "@components/molecules/secondaryActionLink";
import { SplitLayout } from "@components/molecules/splitLayout";
import { useLogin } from "@hooks/auth";
import {
  BOT_INVITE_URL,
  BOT_INVITE_URL_TEXT,
  GUILD_INVITE_URL,
  GUILD_INVITE_URL_TEXT,
  SITE_NAME,
  SITE_OPERATOR,
} from "@utils/env";

export function HomePage() {
  const login = useLogin();

  return (
    <InfoPage>
      <PageHero
        eyebrow="Team Auction with Trader Bot"
        title={`${SITE_NAME}으로 팀원 경매를 간편하게 운영하세요`}
        description="Discord 길드 멤버를 통해 팀원 경매 프리셋을 간편하게 운영하세요"
        actions={
          <>
            <Button variantSize="large" onClick={login}>
              로그인하여 시작하기
            </Button>
            <SecondaryActionLink
              href={BOT_INVITE_URL}
              target="_blank"
              rel="noreferrer"
            >
              {BOT_INVITE_URL_TEXT}
            </SecondaryActionLink>
          </>
        }
      >
        <MetricList
          items={[
            {
              label: "운영자",
              value: SITE_OPERATOR,
            },
            {
              label: "핵심 흐름",
              value: `${BOT_INVITE_URL_TEXT} → 길드 선택 → 프리셋 구성 → 경매 생성`,
            },
            {
              label: "운영 길드",
              value: (
                <Link href={GUILD_INVITE_URL} target="_blank" rel="noreferrer">
                  {GUILD_INVITE_URL_TEXT}
                </Link>
              ),
            },
          ]}
        />
      </PageHero>

      <SplitLayout>
        <PageSection title="핵심 기능">
          <ContentList
            items={[
              "디스코드에서 동기화된 길드와 멤버 정보를 조회하고 별칭, 역할, 안내용 링크를 운영 기준에 맞게 정리합니다.",
              "프리셋마다 포인트, 타이머, 팀 크기, 티어, 포지션, 참여 멤버 구성을 설정하고 재사용합니다.",
              "실시간 팀 경매 화면에서 팀별 입찰과 참가 상태를 확인하며 진행합니다.",
            ]}
          />
        </PageSection>

        <PageSection title="빠른 시작">
          <ContentList
            ordered
            items={[
              `디스코드 계정으로 로그인하고 ${BOT_INVITE_URL_TEXT}를 진행합니다.`,
              "운영할 길드를 선택하고 멤버 정보와 운영용 설정을 확인한 뒤 프리셋을 구성합니다.",
              "공개 여부와 초대 전송 여부를 선택해 팀 경매를 생성합니다.",
            ]}
          />
        </PageSection>
      </SplitLayout>

      <SplitLayout>
        <PageSection
          title="법률 문서"
          description="외부 매체 등록과 공개 운영을 위한 기본 문서를 제공합니다."
          variantSurface="tertiary"
          actions={
            <>
              <Link href="/terms">이용약관 보기</Link>
              <Link href="/privacy">개인정보처리방침 보기</Link>
            </>
          }
        />

        <PageSection
          title="공식 길드"
          description="점검 공지와 운영 문의는 공식 길드 기준으로 안내하는 방식으로 운영합니다."
          variantSurface="tertiary"
          actions={
            <Link href={GUILD_INVITE_URL} target="_blank" rel="noreferrer">
              {GUILD_INVITE_URL_TEXT}
            </Link>
          }
        />
      </SplitLayout>
    </InfoPage>
  );
}
