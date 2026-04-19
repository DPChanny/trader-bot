import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { MarkedPage } from "@components/markedPage";
import { Link } from "@components/atoms/link";
import { Column, Fill, Page, Row, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";

const noteLoaders = import.meta.glob("/src/docs/patches/notes/v*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const planLoaders = import.meta.glob("/src/docs/patches/plans/v*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

type PatchKind = "notes" | "plans";

function getLoaders(kind: PatchKind) {
  return kind === "notes" ? noteLoaders : planLoaders;
}

function extractVersion(path: string) {
  const match = path.match(/\/(v\d+\.\d+\.\d+)\.md$/);
  return match ? match[1] : null;
}

function isVersionName(value: string) {
  return /^v\d+\.\d+\.\d+$/.test(value);
}

function compareSemverDesc(a: string, b: string) {
  const parse = (version: string) =>
    version
      .slice(1)
      .split(".")
      .map((part) => Number.parseInt(part, 10));

  const [aMajor, aMinor, aPatch] = parse(a);
  const [bMajor, bMinor, bPatch] = parse(b);

  const safeAMajor = aMajor ?? 0;
  const safeAMinor = aMinor ?? 0;
  const safeAPatch = aPatch ?? 0;
  const safeBMajor = bMajor ?? 0;
  const safeBMinor = bMinor ?? 0;
  const safeBPatch = bPatch ?? 0;

  if (safeAMajor !== safeBMajor) {
    return safeBMajor - safeAMajor;
  }

  if (safeAMinor !== safeBMinor) {
    return safeBMinor - safeAMinor;
  }

  return safeBPatch - safeAPatch;
}

function compareNames(a: string, b: string) {
  if (isVersionName(a) && isVersionName(b)) {
    return compareSemverDesc(a, b);
  }

  return a.localeCompare(b);
}

function listPatchVersions(kind: PatchKind) {
  return Object.keys(getLoaders(kind))
    .map((path) => extractVersion(path))
    .filter((version): version is string => version !== null)
    .sort(compareNames);
}

function resolvePatchDocPath(version: string) {
  const notePath = `/src/docs/patches/notes/${version}.md`;
  if (noteLoaders[notePath]) {
    return notePath;
  }

  const planPath = `/src/docs/patches/plans/${version}.md`;
  if (planLoaders[planPath]) {
    return planPath;
  }

  return null;
}

export type PatchPageProps = {
  version: string;
};

function toVersionHref(version: string) {
  return `/patch?version=${encodeURIComponent(version)}`;
}

export function PatchPage({ version }: PatchPageProps) {
  const noteVersions = listPatchVersions("notes");
  const planVersions = listPatchVersions("plans");
  const fallbackVersion = [...noteVersions, ...planVersions][0] ?? "";
  const selectedVersion = version || fallbackVersion;
  const docPath = selectedVersion ? resolvePatchDocPath(selectedVersion) : null;

  useEffect(() => {
    if (!selectedVersion) {
      route("/", true);
    }
  }, [selectedVersion]);

  if (!selectedVersion) {
    return null;
  }

  return (
    <Page>
      <PrimarySection gap="md">
        <Row>
          <Fill>
            <SecondarySection gap="md">
              <Title as="h2" align="start">
                Notes
              </Title>
              <Scroll>
                {noteVersions.map((itemVersion) => (
                  <Card key={itemVersion}>
                    <Link href={toVersionHref(itemVersion)}>{itemVersion}</Link>
                  </Card>
                ))}
              </Scroll>
            </SecondarySection>
          </Fill>

          <Fill>
            <SecondarySection gap="md">
              <Title as="h2" align="start">
                Plans
              </Title>
              <Column gap="sm">
                {planVersions.map((itemVersion) => (
                  <Card key={itemVersion}>
                    <Link href={toVersionHref(itemVersion)}>{itemVersion}</Link>
                  </Card>
                ))}
              </Column>
            </SecondarySection>
          </Fill>
        </Row>
      </PrimarySection>
      {docPath ? (
        <MarkedPage path={docPath} />
      ) : (
        <Text align="start">해당 버전 문서를 찾을 수 없습니다.</Text>
      )}
    </Page>
  );
}
