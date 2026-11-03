import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "@/styles/tokens.css";
import "@/styles/components.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  description: "Sigue el avance de tu auto en el Taller Don Ramiro.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
