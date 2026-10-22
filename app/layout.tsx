import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./sw-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartGlass V1 - AI Assistive Prototype",
  description: "Prototype kacamata pintar berbasis AI untuk tunanetra, tunarungu, dan tunawicara.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartGlass",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#090d16] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
