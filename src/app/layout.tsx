import type { Metadata } from "next";
import { Noto_Sans_JP, Outfit } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/lib/brand";
import "./globals.css";

// 単一フォント・必要な weight のみに絞って初期ペイロードを削減
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const SITE_DESCRIPTION = "営業顧問とのベストマッチを実現するプラットフォーム";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://onikana-advisor-matching.vercel.app"
  ),
  title: BRAND.full,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: BRAND.full,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/images/ogp.png",
        width: 1200,
        height: 630,
        alt: BRAND.full,
      },
    ],
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.full,
    description: SITE_DESCRIPTION,
    images: ["/images/ogp.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          {children}
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
