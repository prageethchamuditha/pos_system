import "./globals.css";

import { AuthProvider } from "@/components/AuthGuard";

export const metadata = {
  title: "PRINT X POS",
  description: "Point of Sale system for Print X",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
