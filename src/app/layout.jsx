import "./globals.css";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});
export const metadata = {
  title: {
    default: "TrendWa | عبايات سورية فاخرة وتسوق أونلاين",
    template: "%s | TrendWa",
  },

  description:
    "TrendWa متجر إلكتروني متخصص بالعبايات السورية والأزياء النسائية الفاخرة مع تجربة تسوق عصرية وآمنة داخل سوريا.",

  keywords: [
    "TrendWa",
    "ترند وا",
    "عبايات سورية",
    "عبايات",
    "متجر عبايات",
    "عبايات اونلاين",
    "عبايات فخمة",
    "عبايات نسائية",
    "أزياء نسائية",
    "تسوق اونلاين سوريا",
    "شراء عبايات",
    "عبايات دمشق",
    "عبايات سوداء",
    "عبايات خليجية",
    "عبايات مودرن",
    "عبايات محجبات",
    "متجر ملابس نسائية",
    "Online Shopping Syria",
    "Luxury Abaya",
    "Abaya Store",
    "Women Fashion",
    "Fashion Syria",
  ],

  authors: [{ name: "TrendWa" }],

  creator: "TrendWa",

  metadataBase: new URL("https://trendwa.com"),

  openGraph: {
    title: "TrendWa | Online Syrian Shop | متجر سوري أونلاين",
    description:
      "اكتشف أحدث العبايات السورية والأزياء النسائية الفاخرة مع TrendWa.",
    url: "https://trend-wa.com",
    siteName: "TrendWa",
    locale: "ar_SY",
    type: "website",

    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "TrendWa",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "TrendWa | عبايات سورية",
    description:
      "متجر إلكتروني للعبايات السورية والأزياء النسائية الفاخرة.",
    images: ["/logo.png"],
  },

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={ibmPlexSansArabic.className}>{children}</body>
    </html>
  );
}
