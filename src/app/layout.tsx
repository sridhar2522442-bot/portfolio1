import type { Metadata, Viewport } from "next";
import { Archivo_Black, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "S.SRIDHAR | 3D Interactive Portfolio",
  description: "Passionate about building real-world solutions with code. Always learning. Always building.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivoBlack.variable} ${jetBrainsMono.variable} h-full antialiased`}>
      <body className="h-full w-full m-0 p-0 overflow-hidden font-mono text-text-primary bg-bg-void">
        {children}
        <div className="film-grain" />
      </body>
    </html>
  );
}
