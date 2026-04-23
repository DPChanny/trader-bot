import { MarkedPage } from "./markedPage";
import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { InternalLink } from "@components/atoms/link";
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
import { PHASE } from "@utils/env";
import { Routes } from "@utils/routes";

export type PatchPageProps = {
  version: string;
};

export function PatchPage({ version }: PatchPageProps) {
  const manifest = useManifest();
  const noteVersions = manifest.data?.patches.notes[PHASE] ?? [];
  const planVersions = manifest.data?.patches.plans ?? [];
  const normalizedVersion = version.trim();

  const noteVersionSet = new Set(noteVersions);
  const planVersionSet = new Set(planVersions);
  const isInvalidVersion =
    normalizedVersion.includes("/") || normalizedVersion.includes("\\");

  useEffect(() => {
    if (!normalizedVersion) {
      return;
    }

    if (isInvalidVersion) {
      route(Routes.patch.to, true);
      return;
    }

    if (manifest.isLoading) {
      return;
    }

    if (
      !noteVersionSet.has(normalizedVersion) &&
      !planVersionSet.has(normalizedVersion)
    ) {
      route(Routes.patch.to, true);
    }
  }, [
    isInvalidVersion,
    manifest.isLoading,
    normalizedVersion,
    noteVersionSet,
    planVersionSet,
  ]);

  let markedPath: string | null = null;
  if (!isInvalidVersion && normalizedVersion) {
    const notePath = `/patches/notes/${PHASE}/${normalizedVersion}.md`;
    markedPath = noteVersionSet.has(normalizedVersion) ? notePath : null;
    if (!markedPath) {
      const planPath = `/patches/plans/${normalizedVersion}.md`;
      markedPath = planVersionSet.has(normalizedVersion) ? planPath : null;
    }
  }

  if (markedPath) {
    return <MarkedPage path={markedPath} />;
  }

  if (normalizedVersion && (isInvalidVersion || !manifest.isLoading)) {
    const exists =
      noteVersionSet.has(normalizedVersion) ||
      planVersionSet.has(normalizedVersion);
    if (!exists) {
      return null;
    }
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
                      <InternalLink
                        key={itemVersion}
                        href={Routes.patch.version(itemVersion)}
                      >
                        <Card>
                          <Text>{itemVersion}</Text>
                        </Card>
                      </InternalLink>
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
