import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Empire",
  description: "Your real-life study progress, visualized as a living empire.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
