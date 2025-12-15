import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { PushNotificationInitializer } from "@/components/PushNotificationInitializer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Info Wars - Debate Platform",
  description: "A neutral platform for debate where people wear their ideologies with pride",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          // Hide Clerk branding
          footerAction: { display: "none" },
          footer: { display: "none" },
          // Hide OAuth providers
          socialButtons: { display: "none" },
          socialButtonsBlockButton: { display: "none" },
          // Hide email, password, and name fields
          formFieldInput__emailAddress: { display: "none" },
          formFieldInput__firstName: { display: "none" },
          formFieldInput__lastName: { display: "none" },
          formFieldInput__password: { display: "none" },
          formFieldLabel__emailAddress: { display: "none" },
          formFieldLabel__firstName: { display: "none" },
          formFieldLabel__lastName: { display: "none" },
          formFieldLabel__password: { display: "none" },
        },
      }}
      signInFallbackRedirectUrl="/setup"
      signUpFallbackRedirectUrl="/setup"
    >
      <ConvexClientProvider>
        <html lang="en">
          <head>
            <link rel="manifest" href="/manifest.json" />
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <PushNotificationInitializer />
            {children}
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
