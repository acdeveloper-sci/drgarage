import type { Metadata } from "next";

// Enlaces privados de cada cliente: no deben indexarse.
export const metadata: Metadata = {
  title: "Tu auto · Taller Don Ramiro",
  robots: { index: false, follow: false },
};

export default function ClienteLayout({ children }: LayoutProps<"/auto/[token]">) {
  return <div className="dr-app dr-shell">{children}</div>;
}
