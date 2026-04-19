import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { MarkedPage } from "@components/markedPage";
import { Link } from "@components/atoms/link";
import { Column, Fill, Page, Row, Scroll } from "@components/atoms/layout";
import { Text, Title } from "@components/atoms/text";
import { Card } from "@components/surfaces/card";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";

type DocNode =
  | {
      type: "file";
      path: string;
    }
  | {
      type: "folder";
      folders: string[];
      files: string[];
    };

const docLoaders = import.meta.glob("/src/docs/**/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

function toDocSlug(path: string) {
  return path.replace(/^\/src\/docs\//, "").replace(/\.md$/, "");
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

function getDocFilePath(slug: string) {
  const path = `/src/docs/${slug}.md`;
  return docLoaders[path] ? path : null;
}

function listDocChildren(slug: string) {
  const prefix = slug ? `${slug}/` : "";
  const folderSet = new Set<string>();
  const files: string[] = [];

  for (const path of Object.keys(docLoaders)) {
    const fileSlug = toDocSlug(path);

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

function resolveDocNode(slug: string): DocNode | null {
  const normalized = slug.trim().replace(/^\/+|\/+$/g, "");

  if (normalized) {
    const filePath = getDocFilePath(normalized);
    if (filePath) {
      return {
        type: "file",
        path: filePath,
      };
    }
  }

  const { folders, files } = listDocChildren(normalized);
  if (normalized && folders.length === 0 && files.length === 0) {
    return null;
  }

  return {
    type: "folder",
    folders,
    files,
  };
}

export type DocPageProps = {
  path: string;
};

function toHref(folderPath: string, child: string) {
  return folderPath ? `/docs/${folderPath}/${child}` : `/docs/${child}`;
}

export function DocPage({ path }: DocPageProps) {
  const docNode = resolveDocNode(path);

  useEffect(() => {
    if (!docNode) {
      route("/", true);
    }
  }, [docNode]);

  if (!docNode) {
    return null;
  }

  if (docNode.type === "file") {
    return <MarkedPage path={docNode.path} />;
  }

  const title = path ? `문서: ${path}` : "문서";

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
                  {docNode.folders.length === 0 && (
                    <Text align="start">하위 폴더가 없습니다.</Text>
                  )}
                  {docNode.folders.map((folder) => (
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
                  {docNode.files.length === 0 && (
                    <Text align="start">하위 문서가 없습니다.</Text>
                  )}
                  {docNode.files.map((file) => (
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
