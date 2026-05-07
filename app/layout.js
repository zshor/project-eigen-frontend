import "./globals.css";

export const metadata = {
  title: "Project Eigen | The Mirror",
  description: "Digital Twin & Social Discovery",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black antialiased">{children}</body>
    </html>
  );
}
