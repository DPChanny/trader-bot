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
import { getAnnouncements } from "@utils/marked";
import { MarkedPage } from "./markedPage";

export type AnnouncementPageProps = {
  name: string;
};

export function AnnouncementPage({ name }: AnnouncementPageProps) {
  const manifest = useManifest();
  const files = manifest.data?.files ?? [];
  const announcementNames = useMemo(() => getAnnouncements(files), [files]);
  const announcementSet = new Set(announcementNames);
  const normalizedName = name.trim();
  const isInvalidName =
    normalizedName.includes("/") || normalizedName.includes("\\");

  useEffect(() => {
    if (!normalizedName) {
      return;
    }

    if (isInvalidName) {
      route("/announcement", true);
      return;
    }

    if (manifest.isLoading) {
      return;
    }

    if (!announcementSet.has(normalizedName)) {
      route("/announcement", true);
    }
  }, [announcementSet, isInvalidName, manifest.isLoading, normalizedName]);

  if (!isInvalidName && normalizedName && announcementSet.has(normalizedName)) {
    return <MarkedPage path={`/announcements/${normalizedName}.md`} />;
  }

  if (normalizedName && (isInvalidName || !manifest.isLoading)) {
    if (!announcementSet.has(normalizedName)) {
      return null;
    }
  }

  return (
    <Page>
      <Column align="center" fill>
        <PrimarySection width="page" fill>
          <SecondarySection fill>
            <Title>공지</Title>
            {announcementNames.length > 0 ? (
              <TertiarySection fill>
                <Scroll axis="y">
                  {announcementNames.map((announcementName) => (
                    <InternalLink
                      key={announcementName}
                      href={`/announcement?name=${encodeURIComponent(announcementName)}`}
                    >
                      <Card>
                        <Text>{announcementName}</Text>
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
