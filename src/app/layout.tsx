import type { Metadata } from "next";
import { Barlow, Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { MetaPixel } from "@/components/MetaPixel";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Modo premium del sistema de marca: serif editorial en titulares y
// Barlow (la familia de las landings de Cris) en el cuerpo. next/font las
// sirve desde el propio dominio, así que la CSP no necesita Google Fonts.
const serifMarca = Source_Serif_4({
  variable: "--font-serif-marca",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Diagnóstico tributario inmobiliario | Cris. Tributario",
  description:
    "Descubre en pocos minutos en qué etapa está tu patrimonio inmobiliario y qué hacer esta semana para pagar menos impuesto legalmente y proteger lo que construiste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CL"
      className={`${geistSans.variable} ${geistMono.variable} ${serifMarca.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
