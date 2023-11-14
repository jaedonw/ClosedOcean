import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import './globals.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from '../components/NavigationBar/NavigationBar';
import { SignerProvider } from '../model/SignerContext';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClosedOcean'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SignerProvider>
          <NavigationBar />
          {children}
        </SignerProvider>
      </body>
    </html>
  )
}
