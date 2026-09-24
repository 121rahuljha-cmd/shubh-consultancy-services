import { categorySlug, inventory } from "@/lib/service-inventory";
import { serviceCategories, services } from "@/lib/site-data";

export type MenuItem = {
  id: string;
  pageId: string;
  label: string;
  url: string;
  parentId: string | null;
  order: number;
};

export type EligibleMenuPage = {
  id: string;
  title: string;
  url: string;
  type: "service" | "page" | "category";
};

export type MenuGroup = {
  id: string;
  label: string;
  url: string;
  items: MenuItem[];
};

export const menuStorageKey = "scs-main-menu";

const servicePage = (slug: string) =>
  services.find((service) => service.slug === slug);
const stableId = (kind: string, id: string) => `menu-${kind}-${id}`;

export function getDefaultMenuItems(): MenuItem[] {
  return serviceCategories.flatMap((category, categoryIndex) => {
    const parentId = stableId("category", categorySlug(category));
    const parent: MenuItem = {
      id: parentId,
      pageId: `category-${categorySlug(category)}`,
      label: category,
      url: `/services/category/${categorySlug(category)}`,
      parentId: null,
      order: categoryIndex + 1,
    };
    const children = services
      .filter((service) => service.category === category)
      .map((service, index): MenuItem => ({
        id: stableId("service", service.slug),
        pageId: `service-${service.slug}`,
        label: service.navLabel,
        url: `/services/${service.slug}`,
        parentId,
        order: index + 1,
      }));
    return [parent, ...children];
  });
}

export function getEligibleMenuPages(): EligibleMenuPage[] {
  const base = [
    { id: "home", title: "Home", url: "/", type: "page" as const },
    {
      id: "services",
      title: "All Services",
      url: "/services",
      type: "page" as const,
    },
    { id: "contact", title: "Contact", url: "/contact", type: "page" as const },
    {
      id: "states",
      title: "States and union territories",
      url: "/states",
      type: "page" as const,
    },
    { id: "cities", title: "Cities", url: "/cities", type: "page" as const },
    ...serviceCategories.map((category) => ({
      id: `category-${categorySlug(category)}`,
      title: `${category} services`,
      url: `/services/category/${categorySlug(category)}`,
      type: "category" as const,
    })),
    ...services.map((service) => ({
      id: `service-${service.slug}`,
      title: service.name,
      url: `/services/${service.slug}`,
      type: "service" as const,
    })),
  ];
  const inventoryPages = inventory
    .filter((item) => item.existing)
    .map((item) => ({
      id: `service-${item.slug}`,
      title: item.canonicalTitle,
      url: `/services/${item.slug}`,
      type: "service" as const,
    }));
  return [
    ...base,
    ...inventoryPages.filter(
      (item) => !base.some((existing) => existing.id === item.id),
    ),
  ];
}

export function menuItemsToGroups(items: MenuItem[]): MenuGroup[] {
  return items
    .filter((item) => item.parentId === null)
    .sort((a, b) => a.order - b.order)
    .map((parent) => ({
      id: parent.id,
      label: parent.label,
      url: parent.url,
      items: items
        .filter((item) => item.parentId === parent.id)
        .sort((a, b) => a.order - b.order),
    }));
}

export function filterValidMenuItems(items: MenuItem[]): MenuItem[] {
  const eligible = new Set(getEligibleMenuPages().map((page) => page.id));
  const validIds = new Set(items.map((item) => item.id));
  return items.filter((item) => eligible.has(item.pageId) && (!item.parentId || validIds.has(item.parentId)));
}

export function normalizeMenuItems(items: MenuItem[]): MenuItem[] {
  const unique = items.filter((item, index, all) => all.findIndex((candidate) => candidate.pageId === item.pageId) === index);
  const validIds = new Set(unique.map((item) => item.id));
  const normalized = unique
    .map((item) => ({
      ...item,
      parentId:
        item.parentId &&
        validIds.has(item.parentId) &&
        item.parentId !== item.id
          ? item.parentId
          : null,
    }))
    .map((item) => ({
      ...item,
      order: item.order,
    }));
  return [null, ...Array.from(validIds)].flatMap((parentId) => normalized.filter((item) => item.parentId === parentId).sort((a, b) => a.order - b.order).map((item, index) => ({ ...item, order: index + 1 })));
}

export function readMenuItems(): MenuItem[] {
  if (typeof window === "undefined") return getDefaultMenuItems();
  try {
    const raw = window.localStorage.getItem(menuStorageKey);
    if (!raw) return getDefaultMenuItems();

    const parsed = JSON.parse(raw) as MenuItem[];
    const valid = Array.isArray(parsed) ? filterValidMenuItems(parsed) : [];
    return valid.length ? valid : getDefaultMenuItems();
  } catch {
    return getDefaultMenuItems();
  }
}

export function saveMenuItems(items: MenuItem[]) {
  const next = normalizeMenuItems(items);
  window.localStorage.setItem(
    menuStorageKey,
    JSON.stringify(next),
  );
  window.dispatchEvent(new Event("scs-menu-updated"));
}
