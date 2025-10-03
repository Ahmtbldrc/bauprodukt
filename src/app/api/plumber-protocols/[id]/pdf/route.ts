import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import jsPDF from 'jspdf'
import type { PlumberProtocol } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()
    
    // Get protocol data
    const { data: protocol, error } = await supabase
      .from('plumber_protocols')
      .select('*')
      .eq('id', id)
      .single() as { data: PlumberProtocol | null; error: any }

    if (error || !protocol) {
      return NextResponse.json(
        { error: 'Protokoll nicht gefunden' },
        { status: 404 }
      )
    }

    // Create PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = 20

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize)
      if (isBold) {
        doc.setFont('helvetica', 'bold')
      } else {
        doc.setFont('helvetica', 'normal')
      }
      
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
      doc.text(lines, margin, y)
      y += lines.length * (fontSize * 0.5) + 2
    }

    const addSection = (title: string) => {
      y += 5
      doc.setFillColor(243, 146, 54) // #F39236
      doc.rect(margin, y - 5, pageWidth - 2 * margin, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin + 2, y)
      doc.setTextColor(0, 0, 0)
      y += 8
    }

    const addField = (label: string, value: string | number | null | undefined) => {
      if (value !== null && value !== undefined && value !== '') {
        addText(`${label}: ${value}`)
      }
    }

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Austauschprotokoll für einen Wasserzähler', pageWidth / 2, y, { align: 'center' })
    y += 15

    // Date
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Erstellt am: ${new Date(protocol.created_at).toLocaleDateString('de-CH')}`, pageWidth / 2, y, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    y += 10

    // Einbauort des Messgerätes
    addSection('Einbauort des Messgerätes')
    
    if (protocol.person_type === 'company') {
      addField('Firmenname', protocol.company_name)
      addField('Ansprechsperson', protocol.contact_person)
    } else {
      addField('Name', protocol.person_name)
    }
    
    addField('Strasse / Nr.', protocol.street)
    addField('Zusatz', protocol.additional_info)
    addField('PLZ', protocol.postal_code)
    addField('Ort', protocol.city)
    addField('Telefon', protocol.phone)
    addField('E-Mail', protocol.email)

    // Old Meter Data (if exists)
    if (protocol.old_meter_data) {
      const oldMeter = protocol.old_meter_data as any
      addSection('Altes Messgerät')
      
      addField('Hersteller', oldMeter.manufacturer)
      addField('Zähler-Nr.', oldMeter.meter_number)
      addField('Einbaulänge', oldMeter.installation_length)
      addField('Zählerstand', oldMeter.meter_reading ? `${oldMeter.meter_reading} m³` : undefined)
      addField('Dimension', oldMeter.dimension)
      addField('Dauerdurchfluss', oldMeter.flow_rate)
      addField('Einlaufstrecke', oldMeter.inlet_material && oldMeter.inlet_size 
        ? `${oldMeter.inlet_material} (${oldMeter.inlet_size})`
        : oldMeter.inlet_material)
      addField('Auslaufstrecke', oldMeter.outlet_material && oldMeter.outlet_size
        ? `${oldMeter.outlet_material} (${oldMeter.outlet_size})`
        : oldMeter.outlet_material)
      addField('Einbauart', oldMeter.installation_type)
      addField('Einbauort', oldMeter.installation_location)
      addField('Jahrgang', oldMeter.year_vintage)
      addField('Ausbaudatum', oldMeter.removal_date)
    }

    // New Meter Data
    if (protocol.new_meter_data) {
      const newMeter = protocol.new_meter_data as any
      addSection('Neues Messgerät')
      
      addField('Hersteller', newMeter.manufacturer)
      addField('Zähler-Nr.', newMeter.meter_number)
      addField('Einbaulänge', newMeter.installation_length)
      addField('Zählerstand', newMeter.meter_reading ? `${newMeter.meter_reading} m³` : undefined)
      addField('Dimension', newMeter.dimension)
      addField('Dauerdurchfluss', newMeter.flow_rate)
      addField('Einlaufstrecke', newMeter.inlet_material && newMeter.inlet_size
        ? `${newMeter.inlet_material} (${newMeter.inlet_size})`
        : newMeter.inlet_material)
      addField('Auslaufstrecke', newMeter.outlet_material && newMeter.outlet_size
        ? `${newMeter.outlet_material} (${newMeter.outlet_size})`
        : newMeter.outlet_material)
      addField('Einbauart', newMeter.installation_type)
      addField('Einbauort', newMeter.installation_location)
      addField('Jahrgang', newMeter.year_vintage)
      addField('Einbaudatum', newMeter.installation_date)
    }

    // Notes
    if (protocol.notes) {
      addSection('Bemerkungen')
      addText(protocol.notes)
    }

    // Footer
    y = doc.internal.pageSize.getHeight() - 15
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Bauprodukt AG - Austauschprotokoll Wasserzähler', pageWidth / 2, y, { align: 'center' })

    // Check if preview mode
    const { searchParams } = new URL(request.url)
    const isPreview = searchParams.get('preview') === 'true'

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isPreview 
          ? 'inline; filename="protokoll.pdf"' 
          : `attachment; filename="protokoll-${id}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des PDFs' },
      { status: 500 }
    )
  }
}

