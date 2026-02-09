import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  variable: '--font-kanit'
});

export const metadata: Metadata = {
  title: "ระบบพยากรณ์ความเสี่ยงไฟป่า (ประเทศไทย)",
  description: "แดชบอร์ดเฝ้าระวังไฟป่าและจุดความร้อนแบบเรียลไทม์ในประเทศไทย จากข้อมูลดาวเทียม NASA FIRMS",
  keywords: ["ไฟป่า", "ประเทศไทย", "NASA FIRMS", "แผนที่เรียลไทม์", "พยากรณ์ความเสี่ยง", "จุดความร้อน", "VIIRS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body className={`${kanit.variable} antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}
