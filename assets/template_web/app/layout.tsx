import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConditionalLayout } from "./components/ConditionalLayout";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { UserProvider } from "@/lib/contexts/UserContext";
//import { ToastContainer } from 'react-toastify';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relatórios - LimpaSP",
  description: "Sistema de relatórios da LimpaSP",
};

// Componente removido - usando script inline

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning={true}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Carregar tema salvo
              const savedTheme = localStorage.getItem('theme') || 'light';
              document.documentElement.classList.toggle('dark', savedTheme === 'dark');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <UserProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </UserProvider>
          {/*<ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            closeButton={true}
            limit={3}
          />*/}
        </ThemeProvider>
      </body>
    </html>
  );
}
