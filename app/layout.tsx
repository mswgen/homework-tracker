import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";

import Header from "./header";

import "./globals.css";

const Pretendard = localFont({
  src: '../public/PretendardVariable.woff2',
  weight: "45 920",
  display: "swap"
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      default: process.env.NEXT_PUBLIC_TITLE || '숙제 트래커',
      template: `${process.env.NEXT_PUBLIC_TITLE || '숙제 트래커'} - %s`
    },
    description: process.env.NEXT_PUBLIC_TITLE || '숙제 트래커',
    metadataBase: new URL(process.env.NEXT_PUBLIC_URL!),
    robots: { index: false, follow: false },
    twitter: {
      title: process.env.NEXT_PUBLIC_TITLE || '숙제 트래커',
      description: process.env.NEXT_PUBLIC_TITLE || '숙제 트래커'
    },
    openGraph: {
      title: process.env.NEXT_PUBLIC_TITLE || '숙제 트래커',
      description: process.env.NEXT_PUBLIC_TITLE || '숙제 트래커',
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_URL!}`,
      siteName: process.env.NEXT_PUBLIC_TITLE || '숙제 트래커',
      locale: 'ko_KR'
    },
    alternates: {
      canonical: '/'
    }
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#333333' },
    { media: '(prefers-color-scheme: light)', color: 'white' },
  ]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="text-variable" style={{ fontFamily: Pretendard.style.fontFamily }}>
      <body>
        <Header />
        <main className="flex flex-col items-center justify-between p-12 pb-0 overflow-auto whitespace-nowrap text-nowrap overflow-y-hidden w-max min-w-[40vw] ml-auto mr-auto">
          <div className="border border-slate-400 rounded p-8 w-full">
            {children}
          </div>
        </main>
        <div className="w-full mt-8 mb-8">
          <Link href="https://github.com/mswgen/homework-tracker" rel="noopener noreferrer" target="_blank">
            <Image src="/github.svg" alt="소스코드 보기" width={24} height={24} className="dark:invert opacity-40 ml-auto mr-auto" />
          </Link>
        </div>
      </body>
    </html>
  )
}
