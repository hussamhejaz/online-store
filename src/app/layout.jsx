import "./globals.css";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Store Admin",
  description: "Dashboard login",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={ibmPlexSansArabic.className}>{children}</body>
    </html>
  );
}
