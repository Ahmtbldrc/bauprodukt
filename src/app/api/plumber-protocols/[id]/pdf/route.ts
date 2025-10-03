import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser = null
  
  try {
    const { id } = await params
    
    // Get the preview URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    request.headers.get('origin') || 
                    `http://localhost:${process.env.PORT || 3000}`
    
    const previewUrl = `${baseUrl}/api/plumber-protocols/${id}/preview`
    
    // Check if preview mode or inline mode
    const { searchParams } = new URL(request.url)
    const isPreview = searchParams.get('preview') === 'true'
    const isInline = searchParams.get('inline') === 'true'
    
    if (isPreview) {
      // Redirect to preview endpoint for iframe viewing
      return NextResponse.redirect(previewUrl)
    }
    
    // Launch browser with optimizations
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })
    
    const context = await browser.newContext({
      viewport: { width: 794, height: 1123 }, // A4 size in pixels at 96 DPI
      deviceScaleFactor: 1
    })
    
    const page = await context.newPage()
    
    // Navigate to preview page with faster wait strategy
    await page.goto(previewUrl, {
      waitUntil: 'domcontentloaded', // Much faster than 'networkidle'
      timeout: 15000
    })
    
    // Wait for fonts to load (reduced time)
    await page.waitForLoadState('load')
    await page.waitForTimeout(300) // Reduced from 1000ms
    
    // Generate PDF with optimizations
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      scale: 1
    })
    
    await browser.close()
    browser = null
    
    // Return PDF with appropriate Content-Disposition
    const disposition = isInline 
      ? `inline; filename="Bauprodukt Protokol.pdf"`
      : `attachment; filename="Bauprodukt Protokol.pdf"`
    
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    
    // Clean up browser if still open
    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        console.error('Error closing browser:', e)
      }
    }
    
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des PDFs' },
      { status: 500 }
    )
  }
}
