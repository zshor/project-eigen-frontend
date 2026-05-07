import "./globals.css";

export const metadata = {
  title: "Project Eigen | The Mirror",
  description: "Digital Twin & Social Discovery",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black antialiased">{children}</body>
    </html>
  );
}
