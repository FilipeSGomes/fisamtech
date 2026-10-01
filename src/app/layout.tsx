import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FISAM TECH",
  description: "Architecture and engineering for critical systems",
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
