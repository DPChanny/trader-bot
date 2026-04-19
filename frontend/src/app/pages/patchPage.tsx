import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { MarkedPage } from "@components/markedPage";
import { Link } from "@components/atoms/link";
import { Column, Fill, Page, Row, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";

type PatchNode =
  | {
      type: "file";
      path: string;
    }
  | {
      type: "folder";
      folders: string[];
      files: string[];
    };

const patchLoaders = import.meta.glob("/src/docs/patches/**/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

function toPatchSlug(path: string) {
  return path.replace(/^\/src\/docs\/patches\//, "").replace(/\.md$/, "");
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

function getPatchFilePath(slug: string) {
  const path = `/src/docs/patches/${slug}.md`;
  return patchLoaders[path] ? path : null;
}

function listPatchChildren(slug: string) {
  const prefix = slug ? `${slug}/` : "";
  const folderSet = new Set<string>();
  const files: string[] = [];

  for (const path of Object.keys(patchLoaders)) {
    const fileSlug = toPatchSlug(path);

    if (!fileSlug.startsWith(prefix)) {
      continue;
    }

    const remaining = fileSlug.slice(prefix.length);
    if (!remaining) {
      continue;
    }

    const [head, ...tail] = remaining.split("/");
    if (!head) {
      continue;
    }

    if (tail.length === 0) {
      files.push(head);
      continue;
    }

    folderSet.add(head);
  }

  return {
    folders: Array.from(folderSet).sort(compareNames),
    files: files.sort(compareNames),
  };
}

function resolvePatchNode(slug: string): PatchNode | null {
  const normalized = slug.trim().replace(/^\/+|\/+$/g, "");

  if (normalized) {
    const filePath = getPatchFilePath(normalized);
    if (filePath) {
      return {
        type: "file",
        path: filePath,
      };
    }
  }

  const { folders, files } = listPatchChildren(normalized);
  if (normalized && folders.length === 0 && files.length === 0) {
    return null;
  }

  return {
    type: "folder",
    folders,
    files,
  };
}

export type PatchPageProps = {
  path: string;
};

function toHref(folderPath: string, child: string) {
  const nextPath = folderPath ? `${folderPath}/${child}` : child;
  return `/patches?path=${encodeURIComponent(nextPath)}`;
}

export function PatchPage({ path }: PatchPageProps) {
  const patchNode = resolvePatchNode(path);

  useEffect(() => {
    if (!patchNode) {
      route("/", true);
    }
  }, [patchNode]);

  if (!patchNode) {
    return null;
  }

  if (patchNode.type === "file") {
    return <MarkedPage path={patchNode.path} />;
  }

  const title = path ? `패치 문서: ${path}` : "패치 문서";

  return (
    <Page>
      <Scroll axis="y">
        <Column gap="xl" width="page" self="center">
          <PrimarySection gap="md">
            <Title as="h1" variantSize="hero" align="start">
              {title}
            </Title>
            <Text align="start">
              폴더는 조회 화면으로, 파일은 문서 화면으로 이동합니다.
            </Text>
          </PrimarySection>

          <Row gap="md" wrap>
            <Fill>
              <SecondarySection gap="md">
                <Title as="h2" align="start">
                  Folders
                </Title>
                <Column gap="sm">
                  {patchNode.folders.length === 0 && (
                    <Text align="start">하위 폴더가 없습니다.</Text>
                  )}
                  {patchNode.folders.map((folder) => (
                    <Card key={folder}>
                      <Link href={toHref(path, folder)}>{folder}</Link>
                    </Card>
                  ))}
                </Column>
              </SecondarySection>
            </Fill>

            <Fill>
              <SecondarySection gap="md">
                <Title as="h2" align="start">
                  Files
                </Title>
                <Column gap="sm">
                  {patchNode.files.length === 0 && (
                    <Text align="start">하위 문서가 없습니다.</Text>
                  )}
                  {patchNode.files.map((file) => (
                    <Card key={file}>
                      <Link href={toHref(path, file)}>{file}</Link>
                    </Card>
                  ))}
                </Column>
              </SecondarySection>
            </Fill>
          </Row>
        </Column>
      </Scroll>
    </Page>
  );
}