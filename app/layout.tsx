import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { AchievementProvider } from "./context/AchievementContext";
import { AdminProvider } from "./context/AdminContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import ProfileSetupWrapper from "./components/ProfileSetupWrapper";
import { Toaster } from "react-hot-toast";
import AnimatedBackground from "./components/AnimatedBackground";
import SplashScreenWrapper from "./components/SplashScreenWrapper";

const geistSans = GeistSans;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'),
  title: "Snacx - Share Your Funniest Memes",
  description: "Upload, share, and discover the funniest memes with the community. Join Snacx today!",
  keywords: "memes, funny, humor, share, upload, community, viral, jokes, snacx",
  authors: [{ name: "Snacx Team" }],
  icons: {
    icon: "/snacc-logo.svg",
    shortcut: "/snacc-logo.svg",
    apple: "/snacc-logo.svg",
  },
  openGraph: {
    title: "Snacx - Share Your Funniest Memes",
    description: "Upload, share, and discover the funniest memes with the community. Join Snacx today!",
    type: "website",
    locale: "en_US",
    siteName: "Snacx",
    images: ["/snacc-logo.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Snacx - Share Your Funniest Memes",
    description: "Upload, share, and discover the funniest memes with the community. Join Snacx today!",
    images: ["/snacc-logo.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || localStorage.getItem('snacx-theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  // Default to light theme on error to match server rendering
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen text-foreground antialiased">
        <ThemeProvider>
          <AuthProvider>
            <AdminProvider>
              <AchievementProvider>
                <NotificationProvider>
                  <SplashScreenWrapper>
                    {/* Global Animated Background */}
                    <AnimatedBackground variant="memes" intensity="medium" className="fixed inset-0 z-[1]" />
                    <div className="relative z-[5]">
                      <Navbar />
                      <main className="relative z-[5]">{children}</main>
                    </div>
                    <ProfileSetupWrapper />
                    <Toaster
                      position="bottom-right"
                      toastOptions={{
                        className: "bg-secondary text-text-primary border border-primary/20",
                        style: {
                          background: "var(--color-secondary)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-primary-light)",
                        },
                        duration: 3000,
                      }}
                    />
                  </SplashScreenWrapper>
                </NotificationProvider>
              </AchievementProvider>
            </AdminProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
