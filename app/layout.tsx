import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Lora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/shared/auth-provider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "IncluSearch",
    template: "%s | IncluSearch",
  },
  description:
    "Platform terpercaya menghubungkan orang tua, guru, dan dosen dengan pakar ortopedagogik untuk mendampingi Anak Berkebutuhan Khusus (ABK)",
  keywords: [
    "ortopedagogik",
    "ABK",
    "anak berkebutuhan khusus",
    "konsultasi",
    "pakar",
    "autism",
    "ADHD",
    "pendidikan khusus",
  ],
  authors: [{ name: "IncluSearch Team" }],
  creator: "IncluSearch",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "IncluSearch",
    title: "IncluSearch",
    description:
      "Platform terpercaya untuk mendukung tumbuh kembang Anak Berkebutuhan Khusus",
  },
  twitter: {
    card: "summary_large_image",
    title: "IncluSearch",
    description: "Platform terpercaya untuk mendukung ABK",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "rgb(25, 53, 12)",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakarta.variable} ${lora.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
