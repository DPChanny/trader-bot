import { MarkedPage } from "@components/markedPage";
import { Link } from "@components/atoms/link";
import { Fill, Page, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";

const noteLoaders = import.meta.glob("/src/docs/patches/notes/v*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const planLoaders = import.meta.glob("/src/docs/patches/plans/v*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

function getVersions(kind: string) {
  const loaders = kind === "notes" ? noteLoaders : planLoaders;
  return Object.keys(loaders)
    .map((path) => {
      const match = path.match(/\/(v\d+\.\d+\.\d+)\.md$/);
      return match ? match[1] : null;
    })
    .filter((version): version is string => version !== null)
    .sort((a, b) => {
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
    });
}

export type PatchPageProps = {
  version: string;
};

export function PatchPage({ version }: PatchPageProps) {
  const noteVersions = getVersions("notes");
  const planVersions = getVersions("plans");
  version = version.trim();

  let markedPath: string | null = null;
  if (version) {
    const notePath = `/src/docs/patches/notes/${version}.md`;
    markedPath = noteLoaders[notePath] ? notePath : null;
    if (!markedPath) {
      const planPath = `/src/docs/patches/plans/${version}.md`;
      markedPath = planLoaders[planPath] ? planPath : null;
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
    <Page justify="center">
      <PrimarySection width="page">
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
    </Page>
  );
}
