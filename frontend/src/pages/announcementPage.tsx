import { useEffect, useMemo } from "preact/hooks";
import { route } from "preact-router";
import { InternalLink } from "@components/atoms/link";
import { Column, Page, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Footer } from "@components/footer";
import { useManifest } from "@hooks/public";
import { Routes } from "@utils/routes";
import { MarkedPage } from "./markedPage";

export type AnnouncementPageProps = {
  id: string;
};

export function AnnouncementPage({ id }: AnnouncementPageProps) {
  const manifest = useManifest();
  const announcements = manifest.data?.announcements ?? [];
  const targetId = id?.trim();

  const announcementMap = useMemo(() => {
    const map = new Map<string, (typeof announcements)[0]>();
    for (const ann of announcements) {
      map.set(ann.id, ann);
    }
    return map;
  }, [announcements]);

  const targetAnn = targetId ? announcementMap.get(targetId) : null;

  useEffect(() => {
    if (!targetId || manifest.isLoading) {
      return;
    }

    if (!targetAnn) {
      route(Routes.announcement.to, true);
    }
  }, [manifest.isLoading, targetId, targetAnn]);

  if (targetId && targetAnn) {
    return <MarkedPage path={targetAnn.path} />;
  }

  if (targetId && !manifest.isLoading && !targetAnn) {
    return null;
  }

  return (
    <Page>
      <Column align="center" fill>
        <PrimarySection width="page" fill>
          <SecondarySection fill>
            <Title>공지</Title>
            {announcements.length > 0 ? (
              <TertiarySection fill>
                <Scroll axis="y">
                  {announcements.map((ann) => (
                    <InternalLink
                      key={ann.id}
                      href={Routes.announcement.id(ann.id)}
                    >
                      <Card>
                        <Text>{ann.title}</Text>
                      </Card>
                    </InternalLink>
                  ))}
                </Scroll>
              </TertiarySection>
            ) : (
              <Card>
                <Text>등록된 공지가 없습니다.</Text>
              </Card>
            )}
          </SecondarySection>
        </PrimarySection>
        <Footer />
      </Column>
    </Page>
  );
}
