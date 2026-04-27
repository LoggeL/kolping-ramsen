export type ParentOption = {
  value: string;
  label: string;
  depth: number;
};

export function buildParentOptions(
  slugs: string[],
  excludeSlug?: string,
): ParentOption[] {
  const set = new Set<string>();
  for (const s of slugs) {
    const parts = s.split("/");
    for (let i = 1; i <= parts.length; i++) {
      set.add(parts.slice(0, i).join("/"));
    }
  }
  const isDescendantOfExcluded = excludeSlug
    ? (p: string) => p === excludeSlug || p.startsWith(excludeSlug + "/")
    : () => false;

  const sorted = Array.from(set)
    .filter((p) => !isDescendantOfExcluded(p))
    .sort();

  const options: ParentOption[] = [
    { value: "", label: "Top-Ebene", depth: 0 },
    ...sorted.map((p) => ({
      value: p,
      label: p,
      depth: p.split("/").length,
    })),
  ];
  return options;
}

export function parentPathOfSlug(slug: string): string {
  const parts = slug.split("/");
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

export function leafOfSlug(slug: string): string {
  const parts = slug.split("/");
  return parts[parts.length - 1] ?? "";
}
