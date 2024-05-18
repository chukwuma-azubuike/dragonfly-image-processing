'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/provider/theme';
import store from '@/store';
import { Provider } from 'react-redux';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <Provider store={store}>
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                    <body className={inter.className}>{children}</body>
                </ThemeProvider>
            </Provider>
        </html>
    );
}
