import "./globals.css";

export const viewport = {
  themeColor: "#000000",
};

export const metadata = {
  title: "Project Eigen | The Mirror",
  description: "Digital Twin & Social Discovery",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black antialiased">{children}</body>
    </html>
  );
}
