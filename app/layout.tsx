import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nutrition Tracker",
  description: "AI-powered personal nutrition & macro tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nutrition",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Set the theme class before paint to avoid a flash.
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        {/* Ambient blurred colour blobs the glass panels refract. */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="blob animate-float-slow left-[-8%] top-[-6%] h-72 w-72 bg-carb/70" />
          <div
            className="blob animate-float-slow right-[-6%] top-[8%] h-80 w-80 bg-protein/60"
            style={{ animationDelay: "-4s" }}
          />
          <div
            className="blob animate-float-slow bottom-[-10%] left-[30%] h-96 w-96 bg-fat/60"
            style={{ animationDelay: "-8s" }}
          />
          <div
            className="blob animate-float-slow right-[20%] bottom-[6%] h-64 w-64 bg-cal/50"
            style={{ animationDelay: "-2s" }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
