import { InternalLink } from "@components/atoms/link";
import { Text } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import { TertiarySection } from "@components/surfaces/section";
import { useManifest } from "@hooks/public";
import { Loading } from "@components/molecules/loading";

export function AnnouncementList() {
  const manifest = useManifest();
  const announcements = manifest.data?.announcements ?? [];

  if (manifest.isLoading) {
    return (
      <TertiarySection center>
        <Loading />
      </TertiarySection>
    );
  }

  if (announcements.length === 0) {
    return (
      <TertiarySection center>
        <Text>공지가 없습니다.</Text>
      </TertiarySection>
    );
  }

  return (
    <TertiarySection>
      {announcements.map((ann) => (
        <InternalLink key={ann.id} to="/announcement" search={{ id: ann.id }}>
          <Card>
            <Text>{ann.title}</Text>
          </Card>
        </InternalLink>
      ))}
    </TertiarySection>
  );
}
