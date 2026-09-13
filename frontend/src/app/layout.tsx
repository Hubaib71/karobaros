import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";

export const metadata: Metadata = {
  title: "KarobarOS",
  description: "AI-powered business operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <Sidebar />
        <div className="min-h-screen pl-64">
          {children}
        </div>
      </body>
    </html>
  );
}