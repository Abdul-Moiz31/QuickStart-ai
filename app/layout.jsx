import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import PlausibleProvider from "next-plausible";
import { ReduxProvider } from "./redux-provider";
import { Toaster } from "react-hot-toast";
import GoogleAnalytics from '@/components/GoogleAnalytics';




export const metadata = {
  title: "Quickstart",
  description: "Chat Support Saas.",
};

export default function RootLayout({ children }) {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "";
  const customDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_CUSTOM_DOMAIN;
  return (
    <html lang="en">
      <head>
        {/* add favicon here */}
        <link rel="icon" href="/favicon-32x32.png"/>       
        <PlausibleProvider domain={domain} customDomain={customDomain} />
        {/* Google Analytics */}
        <GoogleAnalytics gaId="G-1JC2XTV9MM" />
      </head>
      <body >
        <ReduxProvider>
        <Providers>
        <Toaster position="top-center" />
          {children}</Providers>
        </ReduxProvider>
      </body>
    </html>
  );
}
