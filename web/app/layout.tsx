import type { Metadata } from "next";
import { IBM_Plex_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { AuthWebProvider } from "@/lib/contexts/AuthWebContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rastro",
  description:
    "Painel administrativo de denúncias ambientais e gestão de resíduos urbanos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme') || 'light';
                document.documentElement.classList.toggle('dark', savedTheme === 'dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${outfit.variable} ${ibmPlexSans.variable} min-h-screen font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthWebProvider>{children}</AuthWebProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
