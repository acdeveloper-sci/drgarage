import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "drGarage",
};

// Cada página del taller pone su propio AppHeader, como en las capturas de design/pantallas.
export default function TallerLayout({ children }: LayoutProps<"/">) {
  return <div className="dr-app dr-shell">{children}</div>;
}
