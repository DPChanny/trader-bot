import { Button } from "@components/atoms/button";
import { Column, Page, Row, Scroll } from "@components/atoms/layout";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { useLogin } from "@hooks/auth";
import styles from "@styles/pages/publicPage.module.css";
import {
  SITE_DISCORD_SERVER_URL,
  SITE_NAME,
  getBotInviteUrl,
} from "@utils/env";

export function HomePage() {
  const login = useLogin();

  return (
    <Page className={styles.pageShell}>
      <Scroll axis="y" className={styles.pageScroll}>
        <Column gap="xl" className={styles.publicContainer}>
          <PrimarySection className={styles.heroSection}>
            <header className={styles.heroHeader}>
              <p className={styles.eyebrow}>DISCORD TEAM AUCTION</p>
              <h1 className={styles.heroTitle}>
                {SITE_NAME}으로 팀 경매 운영 흐름을 일관되게 관리하세요.
              </h1>
              <p className={styles.heroLead}>
                디스코드 계정 로그인 후 길드 멤버 조회, 운영용 설정, 프리셋
                구성, 실시간 팀 경매 진행까지 연결하는 운영자용 웹 도구입니다.
              </p>
            </header>

            <Row gap="md" wrap className={styles.actionRow}>
              <Button variantSize="large" onClick={login}>
                디스코드로 시작하기
              </Button>
              <a
                href={getBotInviteUrl()}
                target="_blank"
                rel="noreferrer"
                className={styles.secondaryActionLink}
              >
                봇 초대 링크
              </a>
            </Row>

            <dl className={styles.metricGrid}>
              <div className={styles.metricCard}>
                <dt className={styles.metricLabel}>운영 대상</dt>
                <dd className={styles.metricValue}>디스코드 길드 운영자</dd>
              </div>
              <div className={styles.metricCard}>
                <dt className={styles.metricLabel}>핵심 흐름</dt>
                <dd className={styles.metricValue}>
                  봇 초대 → 길드 선택 → 프리셋 구성 → 팀 경매 진행
                </dd>
              </div>
              <div className={styles.metricCard}>
                <dt className={styles.metricLabel}>운영 채널</dt>
                <dd className={styles.metricValue}>웹 대시보드 + 공식 채널</dd>
              </div>
            </dl>
          </PrimarySection>

          <div className={styles.splitGrid}>
            <SecondarySection className={styles.contentSection}>
              <section>
                <h2 className={styles.sectionTitle}>핵심 기능</h2>
                <ul className={styles.bulletList}>
                  <li>
                    디스코드에서 동기화된 길드와 멤버 정보를 조회하고 별칭,
                    역할, 안내용 링크를 운영 기준에 맞게 정리합니다.
                  </li>
                  <li>
                    프리셋마다 포인트, 타이머, 팀 크기, 티어, 포지션, 참여 멤버
                    구성을 설정하고 재사용합니다.
                  </li>
                  <li>
                    실시간 팀 경매 화면에서 팀별 입찰과 참가 상태를 확인하며
                    진행합니다.
                  </li>
                </ul>
              </section>
            </SecondarySection>

            <SecondarySection className={styles.contentSection}>
              <section>
                <h2 className={styles.sectionTitle}>빠른 시작</h2>
                <ol className={styles.numberList}>
                  <li>
                    디스코드 계정으로 로그인하고 봇을 운영할 길드에 초대합니다.
                  </li>
                  <li>
                    운영할 길드를 선택하고 멤버 정보와 운영용 설정을 확인한 뒤
                    프리셋을 구성합니다.
                  </li>
                  <li>
                    공개 여부와 초대 전송 여부를 선택해 팀 경매를 생성합니다.
                  </li>
                </ol>
              </section>
            </SecondarySection>
          </div>

          <div className={styles.splitGrid}>
            <TertiarySection className={styles.contentSection}>
              <section>
                <h2 className={styles.sectionTitle}>법률 문서</h2>
                <p className={styles.bodyText}>
                  외부 매체 등록과 공개 운영을 위한 기본 문서를 제공합니다.
                </p>
                <div className={styles.linkGroup}>
                  <a href="/terms" className={styles.inlineLink}>
                    이용약관 보기
                  </a>
                  <a href="/privacy" className={styles.inlineLink}>
                    개인정보처리방침 보기
                  </a>
                </div>
              </section>
            </TertiarySection>

            <TertiarySection className={styles.contentSection}>
              <section>
                <h2 className={styles.sectionTitle}>공식 채널</h2>
                <p className={styles.bodyText}>
                  점검 공지와 운영 문의는 공식 채널 기준으로 안내하는 방식으로
                  운영합니다.
                </p>
                <div className={styles.linkGroup}>
                  <a
                    href={SITE_DISCORD_SERVER_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.inlineLink}
                  >
                    공식 채널 바로가기
                  </a>
                </div>
              </section>
            </TertiarySection>
          </div>
        </Column>
      </Scroll>
    </Page>
  );
}
