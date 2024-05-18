'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import store from '@/store';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <Provider store={store}>
                <body className={inter.className}>{children}</body>
                <ToastContainer theme="dark" position="top-right" />
            </Provider>
        </html>
    );
}
