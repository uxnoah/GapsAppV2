/**
 * MAIN PAGE COMPONENT (page.tsx)
 * ================================
 * This is the entry point of our web application - what users see when they visit the site.
 * In Next.js, any file named 'page.tsx' in the app directory becomes a webpage route.
 * 
 * Think of this like the "front door" of our app.
 */

// IMPORTS SECTION
// ===============
// This line imports our main GAPS diagram component from the components folder
// The '@/' is a shortcut that points to the 'src' folder
import { GapsCanvas } from '@/components/gaps-canvas'

/**
 * HOME COMPONENT FUNCTION
 * =======================
 * This is the main function that defines what appears on the homepage.
 * The 'export default' means this is the main thing this file provides to other files.
 */
export default function Home() {
  // This 'return' statement defines the HTML structure that gets displayed
  return (
    // MAIN CONTAINER
    // ==============
    // 'main' is an HTML element that wraps the primary content
    // 'className' adds CSS styling classes:
    // - 'min-h-screen' = minimum height is full screen height
    // - 'bg-gray-100' = light gray background color
    <main className="min-h-screen bg-gray-100">
      
      {/* VERSION INDICATOR BADGE */}
      {/* ====================== */}
      {/* This shows which version of the app is currently running */}
      {/* 'absolute' positioning places it in a fixed spot on screen */}
      {/* 'top-2 right-2' = 8px from top and right edges */}
      <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
        v3.9-comprehensive-docs
      </div>
      
      {/* MAIN GAPS DIAGRAM COMPONENT */}
      {/* =========================== */}
      {/* This renders our entire GAPS diagram interface */}
      {/* All the drag/drop, editing, and API functionality lives in this component */}
      <GapsCanvas />
    </main>
  )
} 