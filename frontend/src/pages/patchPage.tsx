import { MarkedPage } from "./markedPage";
import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
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

import { PHASE } from "@utils/env";

export function PatchPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, string>;
  const versionParam = search.version?.replace(/^\/+|\/+$/g, "").trim() ?? "";
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
      navigate({ to: "/patch", replace: true });
      return;
    }

    if (manifest.isLoading) {
      return;
    }

    if (
      !noteVersionSet.has(normalizedVersion) &&
      !planVersionSet.has(normalizedVersion)
    ) {
      navigate({ to: "/patch", replace: true });
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
      <Scroll>
        <Column align="center" style={{ minHeight: "100%" }}>
          <PrimarySection width="page" style={{ flex: 1 }}>
            {sections.map(({ title, versions }) => (
              <SecondarySection key={title}>
                <Title>{title}</Title>
                <TertiarySection>
                  {versions.length === 0 ? (
                    <Text>항목이 없습니다.</Text>
                  ) : (
                    versions.map((item) => (
                      <InternalLink
                        key={item.version}
                        to="/patch"
                        search={{ version: item.version }}
                      >
                        <Card>
                          <Text>{item.version}</Text>
                        </Card>
                      </InternalLink>
                    ))
                  )}
                </TertiarySection>
              </SecondarySection>
            ))}
          </PrimarySection>
          <Footer />
        </Column>
      </Scroll>
    </Page>
  );
}
