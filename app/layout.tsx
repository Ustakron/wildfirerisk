import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wildfire Watch TH - Real-time Risk Prediction",
  description: "Advanced wildfire monitoring system for Thailand using NASA FIRMS satellite data.",
  keywords: ["Wildfire", "Thailand", "NASA FIRMS", "Real-time Map", "Risk Prediction", "Fire Hotspots"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}
