import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FISAM TECH",
  description: "Engenharia de software para sistemas em operação.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
