import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import PlausibleProvider from "next-plausible";
import { ReduxProvider } from "./redux-provider";

const inter = Inter({ subsets: ["latin"] });

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
        <PlausibleProvider domain={domain} customDomain={customDomain} />
      </head>
      <body className={inter.className}>
        <ReduxProvider>
        <Providers>{children}</Providers>
        </ReduxProvider>
      </body>
    </html>
  );
}
