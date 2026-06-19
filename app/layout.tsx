import type { Metadata } from "next";
import { SessionProvider } from "@/lib/session";
import "./globals.css";

import { Indie_Flower } from "next/font/google";

const indieFlower = Indie_Flower({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-indie-flower",
});

export const metadata: Metadata = {
  title: "VegR",
  description: "A place for your vegan recipes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={indieFlower.variable}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
