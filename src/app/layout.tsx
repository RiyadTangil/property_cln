import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "e-Hishabi ERP | Real Estate & Development Suite",
  description: "Real Estate & Development Suite",
  icons: {
    icon: "/brand/erp-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="erp-nav-side"
      data-theme="light"
      data-theme-preference="light"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
        <link rel="stylesheet" href="/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/css/style.css" />
        <link rel="stylesheet" href="/css/erp-global.css" />
        <link rel="stylesheet" href="/css/app-vite.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
