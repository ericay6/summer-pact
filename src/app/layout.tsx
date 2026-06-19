import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_NAME, APP_SLOGAN } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_SLOGAN}`,
  description:
    "A private summer accountability game for two friends. Receipts, not vibes.",
};

export const viewport: Viewport = {
  themeColor: "#f25a1b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
