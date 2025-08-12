/**
 * ROOT LAYOUT COMPONENT (layout.tsx)
 * ===================================
 * This file defines the overall structure that wraps around ALL pages in our app.
 * Think of it as the "frame" that goes around every page - it sets up:
 * - The HTML document structure
 * - Fonts and global styling
 * - Page metadata (title, description for search engines)
 * 
 * Every page in our app will be wrapped with this layout.
 */

// IMPORTS SECTION
// ===============
// Import TypeScript types for better code safety
import type { Metadata } from 'next'
// Import Google Font (Inter is a clean, readable font)
import { Inter } from 'next/font/google'
// Import our global CSS styles that apply to the entire app
import './globals.css'
import AppHeader from '@/components/app-header'

// FONT CONFIGURATION
// ==================
// Set up the Inter font from Google Fonts
// 'subsets: ['latin']' means we only load Latin characters (English, etc.)
const inter = Inter({ subsets: ['latin'] })

// PAGE METADATA
// =============
// This information appears in browser tabs and when sharing links
// Search engines also use this information
export const metadata: Metadata = {
  title: 'GAPS Diagram - Interactive Goal Planning',
  description: 'Interactive GAPS diagram with AI chatbot integration',
}

/**
 * ROOT LAYOUT FUNCTION
 * ====================
 * This function creates the basic HTML structure for every page.
 * The 'children' parameter represents the actual page content that gets inserted here.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode  // This type means "any valid React component or content"
}) {
  return (
    // BASIC HTML DOCUMENT STRUCTURE
    // =============================
    // 'lang="en"' tells browsers and screen readers this is English content
    <html lang="en">
      {/* BODY ELEMENT */}
      {/* ============ */}
      {/* Apply our Inter font to the entire page */}
      <body className={inter.className}>
        {/* MAIN CONTENT WRAPPER */}
        {/* ==================== */}
        {/* This wraps all page content with consistent styling */}
        {/* - 'min-h-screen' = at least full screen height */}
        {/* - 'bg-background' and 'text-foreground' = theme colors */}
        <main className="min-h-screen bg-background text-foreground">
          <AppHeader />
          {/* INSERT PAGE CONTENT HERE */}
          {/* ======================== */}
          {/* Whatever page the user visits gets inserted in this spot */}
          {children}
        </main>
      </body>
    </html>
  )
} 