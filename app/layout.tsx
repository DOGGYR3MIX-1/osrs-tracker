import "./globals.css";

export const metadata = {
  title: "OSRS Grind Tracker",
  description: "Personal PvM grind tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
