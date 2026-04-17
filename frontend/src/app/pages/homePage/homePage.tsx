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
              <p className={styles.eyebrow}>DISCORD GUILD OPERATIONS</p>
              <h1 className={styles.heroTitle}>
                {SITE_NAME}으로 길드 경매 운영을 한 화면에서 정리하세요.
              </h1>
              <p className={styles.heroLead}>
                디스코드 로그인, 멤버 동기화, 프리셋 관리, 경매 진행까지 운영
                흐름을 끊지 않고 이어주는 관리자용 도구입니다.
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
                <dd className={styles.metricValue}>디스코드 길드 운영진</dd>
              </div>
              <div className={styles.metricCard}>
                <dt className={styles.metricLabel}>핵심 흐름</dt>
                <dd className={styles.metricValue}>
                  멤버 설정 → 프리셋 → 경매
                </dd>
              </div>
              <div className={styles.metricCard}>
                <dt className={styles.metricLabel}>공지 채널</dt>
                <dd className={styles.metricValue}>홈페이지 + 공식 디스코드</dd>
              </div>
            </dl>
          </PrimarySection>

          <div className={styles.splitGrid}>
            <SecondarySection className={styles.contentSection}>
              <section>
                <h2 className={styles.sectionTitle}>핵심 기능</h2>
                <ul className={styles.bulletList}>
                  <li>
                    길드와 멤버 정보를 동기화하고 운영 기준에 맞게 정리합니다.
                  </li>
                  <li>티어, 포지션, 포인트 규칙을 프리셋으로 재사용합니다.</li>
                  <li>실제 진행 흐름에 맞춰 경매를 열고 결과를 확인합니다.</li>
                </ul>
              </section>
            </SecondarySection>

            <SecondarySection className={styles.contentSection}>
              <section>
                <h2 className={styles.sectionTitle}>빠른 시작</h2>
                <ol className={styles.numberList}>
                  <li>디스코드 계정으로 로그인합니다.</li>
                  <li>운영할 길드를 선택하고 멤버 정보를 확인합니다.</li>
                  <li>프리셋을 만든 뒤 경매를 시작합니다.</li>
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
                  점검 공지와 운영 문의는 공식 디스코드 서버 한 곳에서 확인하는
                  구성이 가장 단순합니다.
                </p>
                <div className={styles.linkGroup}>
                  <a
                    href={SITE_DISCORD_SERVER_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.inlineLink}
                  >
                    공식 디스코드 바로가기
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
