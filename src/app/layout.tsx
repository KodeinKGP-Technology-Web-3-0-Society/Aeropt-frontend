import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";

// One engineered sans for everything (headings included) — no serif display face, which gave
// the site the generic AI "editorial" look. Plex Mono for formulas and code.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("jeepath_theme")||localStorage.getItem("prepwise_theme");if(t!=="dark")t="light";document.documentElement.setAttribute("data-theme",t);document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.classList.toggle("light",t==="light");}catch(e){}})();`;

export const metadata: Metadata = {
  title: "JEEPath — your path to JEE",
  description: "Knows where you're stuck before you do.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className={`${plexSans.variable} ${plexMono.variable} ${inter.variable} font-sans antialiased`}>
        <ErrorBoundary scope="app-shell">
          <AppProvider>
            {children}
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
