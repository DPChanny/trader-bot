import { useEffect, useMemo } from "preact/hooks";
import { route } from "preact-router";
import { Column, Page } from "@components/atoms/layout";
import { Title } from "@components/atoms/text";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";
import { Footer } from "@components/footer";
import { AnnouncementList } from "@components/announcementList";
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
            <AnnouncementList />
          </SecondarySection>
        </PrimarySection>
        <Footer />
      </Column>
    </Page>
  );
}
