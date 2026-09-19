import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("prepwise_theme");if(t!=="dark")t="light";document.documentElement.setAttribute("data-theme",t);document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.classList.toggle("light",t==="light");}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Prepwise — JEE Prep Copilot",
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
      <body className={`${sourceSans.variable} ${sourceSerif.variable} font-sans antialiased`}>
        <ErrorBoundary scope="app-shell">
          <AppProvider>
            {children}
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
