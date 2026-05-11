import "./globals.css";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});
export const metadata = {
  title: {
    title: "TrendWa |تريند وا",
    template: "%s | TrendWa",
  },

  description:
    "TrendWa متجر إلكتروني متخصص بالعبايات السورية والأزياء النسائية الفاخرة مع تجربة تسوق عصرية وآمنة داخل سوريا.",

  keywords: [
    "TrendWa",
    "ترند وا",
    "Trend Wa",
    "trendwa store",
    "trendwa sy",
    "trendwa syria",
    "عبايات سورية",
    "عبايات",
    "متجر عبايات",
    "متجر عبايات سورية",
    "متجر عبايات دمشق",
    "عبايات سورية اونلاين",
    "عبايات اونلاين",
    "عبايات اون لاين",
    "عبايات فخمة",
    "عبايات راقية",
    "عبايات أنيقة",
    "عبايات نسائية",
    "عبايات نساء",
    "أزياء نسائية",
    "ازياء نسائية",
    "موضة نسائية",
    "تسوق اونلاين سوريا",
    "تسوق في سوريا",
    "التسوق الإلكتروني سوريا",
    "شراء عبايات",
    "شراء عباية",
    "شراء عبايات اونلاين",
    "عبايات دمشق",
    "عبايات سوريا",
    "عبايات الشام",
    "عبايات سوداء",
    "عبايات ملونة",
    "عبايات خليجية",
    "عبايات مودرن",
    "عبايات حديثة",
    "عبايات كاجوال",
    "عبايات رسمية",
    "عبايات محجبات",
    "عبايات للمحجبات",
    "عبايات للمناسبات",
    "متجر ملابس نسائية",
    "ملابس نسائية اونلاين",
    "ملابس نسائية سوريا",
    "فساتين وعبايات",
    "عباية سورية",
    "عباية خليجية",
    "عباية سوداء",
    "عباية فخمة",
    "أفضل متجر عبايات",
    "احدث موديلات العبايات",
    "موديلات عبايات 2026",
    "عبايات ترند",
    "أزياء محجبات",
    "عبايات مطرزة",
    "عبايات سادة",
    "عبايات منزلية",
    "عبايات خروج",
    "عبايات عملية",
    "عبايات فاخرة",
    "عبايات سعر مناسب",
    "متجر نسائي سوريا",
    "متجر إلكتروني سوريا",
    "موقع عبايات",
    "Online Shopping Syria",
    "Syria Online Store",
    "Syrian Fashion Store",
    "Syrian Women Fashion",
    "Abaya Online",
    "Buy Abaya Online",
    "Luxury Abaya",
    "Luxury Abayas",
    "Abaya Store",
    "Abaya Shop",
    "Abaya Collection",
    "Black Abaya",
    "Modern Abaya",
    "Modest Fashion",
    "Women Fashion",
    "Women Clothing Online",
    "Hijab Fashion",
    "Arabic Fashion",
    "Fashion Syria",
    "سوريا",
    "سويا",
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
   title: "TrendWa | Online Syrian Shop | متجر سوري أونلاين",
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
