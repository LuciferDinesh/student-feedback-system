import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Configure Google Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO metadata configuration
export const metadata: Metadata = {
  title: "Student Feedback System - Google Sheets Admin",
  description: "Rate your teachers and help improve education quality. Admin configured via Google Sheets.",
};

/**
 * Root Layout Component
 * Wraps all pages with consistent HTML structure and styling
 * 
 * @param children - Child components to be rendered within the layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
