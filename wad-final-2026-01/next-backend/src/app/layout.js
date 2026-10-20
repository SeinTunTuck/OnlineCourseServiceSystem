import "./globals.css";

export const metadata = {
  title: "Course Hub API",
  description: "Course management API",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
