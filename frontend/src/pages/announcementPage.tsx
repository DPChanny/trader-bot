import { useEffect, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Page, Scroll, Column } from "@components/atoms/layout";
import { Title } from "@components/atoms/text";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";
import { Footer } from "@components/footer";
import { AnnouncementList } from "@components/announcementList";
import { useManifest } from "@hooks/public";

import { MarkedPage } from "./markedPage";

export function AnnouncementPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const id = search.id != null ? parseInt(String(search.id), 10) : null;

  const manifest = useManifest();
  const announcements = manifest.data?.announcements ?? [];

  const announcementMap = useMemo(() => {
    const map = new Map<number, (typeof announcements)[0]>();
    for (const ann of announcements) {
      map.set(ann.id, ann);
    }
    return map;
  }, [announcements]);

  const targetAnn = id !== null ? announcementMap.get(id) : null;

  useEffect(() => {
    if (id === null || manifest.isLoading) {
      return;
    }

    if (!targetAnn) {
      navigate({ to: "/announcement", replace: true });
    }
  }, [manifest.isLoading, id, targetAnn]);

  if (id !== null && targetAnn) {
    return <MarkedPage path={targetAnn.path} />;
  }

  if (id !== null && !manifest.isLoading && !targetAnn) {
    return null;
  }

  return (
    <Page>
      <Scroll>
        <Column align="center" style={{ minHeight: "100%" }}>
          <PrimarySection width="page" style={{ flex: 1 }}>
            <SecondarySection>
              <Title>공지</Title>
              <AnnouncementList />
            </SecondarySection>
          </PrimarySection>
          <Footer />
        </Column>
      </Scroll>
    </Page>
  );
}
