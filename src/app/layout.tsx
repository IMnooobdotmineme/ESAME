import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="bg-[#F8FAFC] text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}