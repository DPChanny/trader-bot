import { MarkedPage } from "./markedPage";
import { useEffect, useMemo, useState } from "preact/hooks";
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
import { loadPublicManifest, type PublicManifest } from "@utils/public";

function getVersions(kind: "notes" | "plans", manifest: PublicManifest) {
  const prefix = kind === "notes" ? "/patches/notes/" : "/patches/plans/";
  const versions = manifest.files
    .filter(
      (filePath) => filePath.startsWith(prefix) && filePath.endsWith(".md"),
    )
    .map((filePath) => filePath.slice(prefix.length, -3))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return kind === "notes" ? versions.reverse() : versions;
}

export type PatchPageProps = {
  version: string;
};

export function PatchPage({ version }: PatchPageProps) {
  const [manifest, setManifest] = useState<PublicManifest>({ files: [] });
  const noteVersions = useMemo(
    () => getVersions("notes", manifest),
    [manifest],
  );
  const planVersions = useMemo(
    () => getVersions("plans", manifest),
    [manifest],
  );
  version = version.trim();

  useEffect(() => {
    let isActive = true;

    loadPublicManifest().then((nextManifest) => {
      if (!isActive) {
        return;
      }
      setManifest(nextManifest);
    });

    return () => {
      isActive = false;
    };
  }, []);

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
