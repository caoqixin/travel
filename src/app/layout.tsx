import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = process.env.NEXT_PUBLIC_APP_NAME;

export const metadata: Metadata = {
  title: {
    default: `${appName}- 意大利中国航班价格查询`,
    template: `%s | ${appName}`,
  },
  description: `${appName} 旅行社提供意大利至中国航班价格查询服务。查看我们可提供的航班信息及参考价格，价格实时波动，具体价格请联系客服微信咨询。不支持在线预订，需联系客服订购。`,
  keywords: [
    "意大利中国航班",
    "航班价格查询",
    "机票价格",
    "旅行社",
    "航班信息",
    appName || "Xinyue Travel",
    "意大利回国航班",
    "客服咨询",
    "微信订购",
  ],
  authors: [{ name: `${appName} Team` || "Xinyue Travel Team" }],
  creator: appName || "Xinyue Travel",
  publisher: appName || "Xinyue Travel",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    title: `${appName} - 意大利中国航班价格查询`,
    description: `${appName} 旅行社提供意大利至中国航班价格查询服务，价格仅供参考，具体价格请联系客服微信咨询订购。`,
    siteName: appName || "Xinyue Travel",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${appName} - 意大利中国航班价格查询`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} - 意大利中国航班价格查询`,
    description: `${appName} 旅行社提供意大利至中国航班价格查询服务，价格仅供参考，具体价格请联系客服微信咨询订购。`,
    images: ["/og-image.jpg"],
    creator: "@XinyueTravel",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Xinyue Travel",
    description:
      "意大利至中国航班价格查询服务，提供航班信息及参考价格，具体价格需联系客服微信咨询",
    url: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    logo: {
      "@type": "ImageObject",
      url: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/logo.png`,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["Chinese"],
      description: "微信客服咨询及订购服务",
    },
    areaServed: [
      {
        "@type": "Country",
        name: "Italy",
      },
      {
        "@type": "Country",
        name: "China",
      },
    ],
    serviceType: "航班价格查询服务",
  };

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}

        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
