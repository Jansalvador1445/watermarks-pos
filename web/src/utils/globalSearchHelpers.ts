import { MENU_GROUPS } from '@/utils/constants';

export type SearchResultType = 'page' | 'customer' | 'transaction' | 'delivery' | 'user';

export interface SearchOption {
  value: string;
  label: string;
  route: string;
  type: SearchResultType;
}

export interface SearchOptionGroup {
  label: string;
  options: SearchOption[];
}

const normalize = (value: string) => value.trim().toLowerCase();

const matchesMenuItem = (term: string, itemLabel: string, groupLabel: string, route: string) => {
  const label = itemLabel.toLowerCase();
  const group = groupLabel.toLowerCase();
  const path = route.toLowerCase().replace(/^\//, '').replace(/-/g, ' ');

  return (
    label.includes(term) ||
    group.includes(term) ||
    path.includes(term) ||
    term.split(/\s+/).every((word) => label.includes(word) || group.includes(word) || path.includes(word))
  );
};

export const searchSidebarPages = (
  query: string,
  hasPermission: (permission: string) => boolean,
): SearchOption[] => {
  const term = normalize(query);
  if (term.length < 1) return [];

  const results: SearchOption[] = [];

  for (const group of MENU_GROUPS) {
    for (const item of group.items) {
      if (!hasPermission(item.permission)) continue;
      if (!matchesMenuItem(term, item.label, group.label, item.key)) continue;

      results.push({
        value: `page-${item.key}`,
        label: `${item.label} · ${group.label}`,
        route: item.key,
        type: 'page',
      });
    }
  }

  return results;
};

export const buildGroupedSearchOptions = (groups: Array<{ label: string; options: SearchOption[] }>): SearchOptionGroup[] =>
  groups.filter((group) => group.options.length > 0);

export const flattenSearchOptions = (groups: SearchOptionGroup[]): SearchOption[] =>
  groups.flatMap((group) => group.options);
