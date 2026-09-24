"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  getDefaultMenuItems,
  getEligibleMenuPages,
  menuItemsToGroups,
  readMenuItems,
  saveMenuItems,
  type MenuItem,
} from "@/lib/menu-management";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

function reorder(
  items: MenuItem[],
  itemId: string,
  parentId: string | null,
  beforeId?: string,
) {
  const moving = items.find((item) => item.id === itemId);
  if (!moving) return items;
  const remaining = items.filter((item) => item.id !== itemId);
  const siblings = remaining.filter((item) => item.parentId === parentId);
  const index = beforeId
    ? Math.max(
        0,
        siblings.findIndex((item) => item.id === beforeId),
      )
    : siblings.length;
  siblings.splice(index < 0 ? siblings.length : index, 0, {
    ...moving,
    parentId,
  });
  const orders = new Map(siblings.map((item, order) => [item.id, order + 1]));
  const siblingIds = new Set(siblings.map((item) => item.id));
  return remaining
    .filter((item) => !siblingIds.has(item.id))
    .concat(siblings)
    .map((item) =>
      orders.has(item.id)
        ? { ...item, order: orders.get(item.id) as number }
        : item,
    );
}

export function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>(() => readMenuItems());
  const [selectedParent, setSelectedParent] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const groups = menuItemsToGroups(items);
  const eligible = useMemo(
    () =>
      getEligibleMenuPages().filter(
        (page) =>
          `${page.title} ${page.url}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          !items.some((item) => item.pageId === page.id),
      ),
    [items, query],
  );
  const update = (next: MenuItem[]) => {
    setItems(next);
    setNotice("Unsaved changes");
  };
  const save = () => {
    saveMenuItems(items);
    setItems(readMenuItems());
    setNotice("Menu saved");
  };
  const add = (pageId: string, label: string, url: string) =>
    update([
      ...items,
      {
        id: `menu-custom-${pageId}-${Date.now()}`,
        pageId,
        label,
        url,
        parentId: selectedParent || null,
        order:
          items.filter((item) => item.parentId === (selectedParent || null))
            .length + 1,
      },
    ]);
  const remove = (id: string) =>
    update(items.filter((item) => item.id !== id && item.parentId !== id));
  const move = (itemId: string, parentId: string | null, beforeId?: string) =>
    update(reorder(items, itemId, parentId, beforeId));
  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Admin / navigation</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-navy">
              Main menu
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Manage the existing homepage menu hierarchy. Only two levels are
              supported.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="rounded-md border border-border px-4 py-2.5 text-sm font-bold text-navy"
            >
              Back to admin
            </Link>
            <button
              type="button"
              onClick={save}
              className="rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white"
            >
              Save
            </button>
          </div>
        </div>
        {notice && (
          <p className="mb-5 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
            {notice}
          </p>
        )}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl border border-border bg-background p-5">
            <h2 className="font-serif text-xl font-bold text-navy">
              Current hierarchy
            </h2>
            <div className="mt-5 flex flex-col gap-3" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = event.dataTransfer.getData("text/menu-id"); if (id) move(id, null); }}>
              {groups.map((group) => (
                <div
                  key={group.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => { event.stopPropagation(); const id = event.dataTransfer.getData("text/menu-id"); const moving = items.find((item) => item.id === id); if (id && moving) move(id, moving.parentId === null ? null : group.id, moving.parentId === null ? group.id : undefined); }}
                  className="rounded-lg border border-border p-3"
                >
                  <div
                    draggable
                    onDragStart={(event) =>
                      event.dataTransfer.setData("text/menu-id", group.id)
                    }
                    className="flex items-center gap-3"
                  >
                    <span
                      className="cursor-grab text-lg"
                      aria-label="Drag handle"
                    >
                      ☰
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy">{group.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {group.url}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(group.id)}
                      className="text-xs font-bold text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 flex flex-col gap-2 pl-8">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(event) =>
                          event.dataTransfer.setData("text/menu-id", item.id)
                        }
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.stopPropagation();
                          const id = event.dataTransfer.getData("text/menu-id");
                          if (id && id !== item.id) move(id, group.id, item.id);
                        }}
                        className="flex items-center gap-3 rounded-md bg-surface px-3 py-2"
                      >
                        <span
                          className="cursor-grab text-sm"
                          aria-label="Drag handle"
                        >
                          ☰
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-navy">
                            ↳ {item.label}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.url}
                          </p>
                        </div>
                        <button type="button" onClick={() => move(item.id, null)} className="text-xs font-bold text-navy">Main Menu</button>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="text-xs font-bold text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!groups.length && (
                <p className="text-sm text-muted-foreground">
                  No menu items saved.
                </p>
              )}
            </div>
          </section>
          <aside className="h-fit rounded-xl border border-border bg-background p-5 lg:sticky lg:top-6">
            <h2 className="font-serif text-xl font-bold text-navy">
              Add public page
            </h2>
            <input
              className={`${inputClass} mt-4`}
              placeholder="Search eligible pages"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-navy">
              Add under
              <select
                className={inputClass}
                value={selectedParent}
                onChange={(event) => setSelectedParent(event.target.value)}
              >
                <option value="">Main Menu</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-4 flex max-h-[32rem] flex-col gap-2 overflow-y-auto">
              {eligible.map((page) => (
                <div
                  key={page.id}
                  className="rounded-md border border-border p-3"
                >
                  <p className="text-sm font-semibold text-navy">
                    {page.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {page.url}
                  </p>
                  <button
                    type="button"
                    onClick={() => add(page.id, page.title, page.url)}
                    className="mt-2 text-xs font-bold text-brand"
                  >
                    Add {selectedParent ? "as submenu" : "to main menu"}
                  </button>
                </div>
              ))}
              {!eligible.length && (
                <p className="text-sm text-muted-foreground">
                  No eligible pages match.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setItems(getDefaultMenuItems());
                setNotice("Default hierarchy loaded; save to apply it.");
              }}
              className="mt-5 text-xs font-bold text-muted-foreground hover:text-brand"
            >
              Restore default hierarchy
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
