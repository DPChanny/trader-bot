import { MarkedPage } from "./markedPage";
import { useMemo } from "preact/hooks";
import { Link } from "@components/atoms/link";
import { Column, Fill, Page, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Footer } from "@components/footer";
import { useManifest } from "@hooks/public";
import { getNotes, getPlans } from "@utils/marked";

export type PatchPageProps = {
  version: string;
};

export function PatchPage({ version }: PatchPageProps) {
  const manifest = useManifest();
  const files = manifest.data?.files ?? [];
  const noteVersions = useMemo(() => getNotes(files), [files]);
  const planVersions = useMemo(() => getPlans(files), [files]);
  version = version.trim();

  const noteVersionSet = new Set(noteVersions);
  const planVersionSet = new Set(planVersions);

  let markedPath: string | null = null;
  if (version) {
    const notePath = `/patches/notes/${version}.md`;
    markedPath = noteVersionSet.has(version) ? notePath : null;
    if (!markedPath) {
      const planPath = `/patches/plans/${version}.md`;
      markedPath = planVersionSet.has(version) ? planPath : null;
    }
  }

  if (markedPath) {
    return <MarkedPage path={markedPath} />;
  }

  const sections = [
    { title: "패치 노트", versions: noteVersions },
    { title: "패치 계획", versions: planVersions },
  ];

  return (
    <Page>
      <Column align="center" fill>
        <PrimarySection width="page" fill>
          {sections.map(({ title, versions }) => (
            <Fill key={title}>
              <SecondarySection fill>
                <Title>{title}</Title>
                <TertiarySection fill>
                  <Scroll axis="y">
                    {versions.map((itemVersion) => (
                      <Link
                        key={itemVersion}
                        href={`/patch?version=${encodeURIComponent(itemVersion)}`}
                      >
                        <Card>
                          <Text>{itemVersion}</Text>
                        </Card>
                      </Link>
                    ))}
                  </Scroll>
                </TertiarySection>
              </SecondarySection>
            </Fill>
          ))}
        </PrimarySection>
        <Footer />
      </Column>
    </Page>
  );
}
