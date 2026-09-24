import type { Metadata } from "next";
import { MenuManager } from "@/components/admin/menu-manager";

export const metadata: Metadata = {
  title: "Main Menu",
  robots: { index: false, follow: false },
};

export default function MenuPage() {
  return <MenuManager />;
}
