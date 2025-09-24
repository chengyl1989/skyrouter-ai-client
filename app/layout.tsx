import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/globals.css'
import '@/styles/animations.css'
import '@/styles/modern.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorProvider } from '@/contexts/ErrorContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: '小宿AI助手 - 智能对话、搜索、创作平台',
    description: '小宿科技AI演示平台，集成智能对话、搜索、图片生成、视频创作等功能，体验前沿人工智能技术的无限可能',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={`${inter.className} bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-300`}>
        <ErrorBoundary>
          <ThemeProvider>
            <ErrorProvider>
              {children}
            </ErrorProvider>
          </ThemeProvider>
          <ThemeProvider>
            <ErrorProvider>
              {children}
            </ErrorProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}