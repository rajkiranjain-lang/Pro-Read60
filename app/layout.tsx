import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pro-Read60",
  description: "A modern community platform for publishing, conversation and discovery.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
