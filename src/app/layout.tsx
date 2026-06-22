import './globals.css';
export const metadata = {
  title: 'Aetherdeck',
  description: 'Premium Commander deckbuilding',
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
