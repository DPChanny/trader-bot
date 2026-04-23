import { useEffect, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Column, Page } from "@components/atoms/layout";
import { Title } from "@components/atoms/text";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";
import { Footer } from "@components/footer";
import { AnnouncementList } from "@components/announcementList";
import { useManifest } from "@hooks/public";


import { MarkedPage } from "./markedPage";

export function AnnouncementPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, string>;
  const idParam = search.id
      ?.replace(/^\/+|\/+$/g, "")
      .trim() ?? "";
  const id = idParam;

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
      navigate({ to: '/announcement', replace: true });
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
