import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import AppShell from "@/components/layout/AppShell";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Selfware - A file is an app",
  description:
    "Selfware 协议的参考实现——一个 local-first 的文档运行时，让文件自带数据、逻辑和视图",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
