import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mindful Chat",
  description:
    "A supportive mental wellness chatbot built with Next.js and Hugging Face.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-frame">{children}</div>
      </body>
    </html>
  );
}
