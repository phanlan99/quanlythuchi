import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ExpenseProvider } from "@/context/ExpenseProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quản lý chi tiêu",
  description: "Ứng dụng quản lý chi tiêu sinh hoạt hằng ngày",
};

// The sidebar is intentionally NOT here — pages opt in via <PageWithSidebar>.
// ExpenseProvider only holds in-memory demo data so it survives client navigation.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ExpenseProvider>{children}</ExpenseProvider>
      </body>
    </html>
  );
}
