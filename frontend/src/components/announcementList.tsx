import { InternalLink } from "@components/atoms/link";
import { Scroll } from "@components/atoms/layout";
import { Text } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import { TertiarySection } from "@components/surfaces/section";
import { Routes } from "@utils/routes";
import { useManifest } from "@hooks/public";
import { Loading } from "@components/molecules/loading";

export function AnnouncementList() {
  const manifest = useManifest();
  const announcements = manifest.data?.announcements ?? [];

  return (
    <TertiarySection fill>
      {manifest.isLoading ? (
        <Loading />
      ) : announcements.length > 0 ? (
        <Scroll axis="y">
          {announcements.map((ann) => (
            <InternalLink key={ann.id} href={Routes.announcement.id(ann.id)}>
              <Card>
                <Text>{ann.title}</Text>
              </Card>
            </InternalLink>
          ))}
        </Scroll>
      ) : null}
    </TertiarySection>
  );
}
