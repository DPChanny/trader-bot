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
import { useRouteQueryParam } from "@hooks/route";
import { PHASE } from "@utils/env";
import { Routes } from "@utils/routes";

export function PatchPage() {
  const versionParam =
    useRouteQueryParam("version")
      ?.replace(/^\/+|\/+$/g, "")
      .trim() ?? "";
  const version = versionParam;

  const manifest = useManifest();
  const noteVersions = manifest.data?.patches.notes[PHASE] ?? [];
  const planVersions = manifest.data?.patches.plans ?? [];
  const normalizedVersion = version.trim();

  const noteVersionSet = new Set(noteVersions.map((v) => v.version));
  const planVersionSet = new Set(planVersions.map((v) => v.version));
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
    const noteMatch = noteVersions.find((v) => v.version === normalizedVersion);
    markedPath = noteMatch ? noteMatch.path : null;
    if (!markedPath) {
      const planMatch = planVersions.find(
        (v) => v.version === normalizedVersion,
      );
      markedPath = planMatch ? planMatch.path : null;
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
                    {versions.map((item) => (
                      <InternalLink
                        key={item.version}
                        href={Routes.patch.version(item.version)}
                      >
                        <Card>
                          <Text>{item.version}</Text>
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
