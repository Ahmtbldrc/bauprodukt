import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PlumberProtocol } from '@/types/database'

// Generate HTML template as string
function generateProtocolHTML(protocol: PlumberProtocol): string {
  const oldMeter = protocol.old_meter_data as any
  const newMeter = protocol.new_meter_data as any
  
  const renderField = (label: string, value: any) => {
    if (!value) return ''
    return `
      <div class="field-group">
        <div class="field-label">${label}</div>
        <div class="field-value">${value}</div>
      </div>
    `
  }
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Austauschprotokoll Wasserzähler</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1f2937;
      background: white;
      -webkit-font-smoothing: antialiased;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      background: #4b4b4b;
      color: white;
      padding: 24px;
      margin: -20mm -20mm 20px -20mm;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24pt;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }
    
    .header p {
      font-size: 14pt;
      font-weight: 400;
      opacity: 0.95;
    }
    
    .metadata {
      background: #f5f5f5;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #646464;
    }
    
    .section {
      margin-bottom: 24px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    .section:not(:first-of-type) {
      page-break-before: auto;
      padding-top: 20px;
    }
    
    .section-title {
      background: #F39236;
      color: white;
      padding: 10px 12px;
      font-size: 12pt;
      font-weight: 600;
      border-radius: 6px;
      margin-bottom: 16px;
      letter-spacing: -0.01em;
    }
    
    .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px 24px;
    }
    
    .field-group {
      break-inside: avoid;
    }
    
    .field-label {
      font-size: 8.5pt;
      font-weight: 600;
      color: #646464;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      margin-bottom: 4px;
    }
    
    .field-value {
      font-size: 10pt;
      font-weight: 500;
      color: #1f2937;
      line-height: 1.4;
    }
    
    .notes-box {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 6px;
      border-left: 4px solid #F39236;
      font-size: 10pt;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 8pt;
      color: #646464;
      display: flex;
      justify-content: space-between;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .page {
        margin: 0;
        padding: 20mm;
      }
      
      .header {
        margin: -20mm -20mm 20px -20mm;
      }
      
      .section {
        page-break-after: auto;
      }
      
      .section:not(:first-of-type) {
        margin-top: 30px;
      }
      
      .footer {
        position: fixed;
        bottom: 15mm;
        left: 20mm;
        right: 20mm;
        margin-top: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Austauschprotokoll</h1>
      <p>Wasserzähler</p>
    </div>
    
    <div class="metadata">
      <span><strong>Protokoll-ID:</strong> ${protocol.id.substring(0, 8).toUpperCase()}</span>
      <span><strong>Erstellt am:</strong> ${new Date(protocol.created_at).toLocaleDateString('de-CH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}</span>
    </div>

    <div class="section">
      <div class="section-title">Einbauort des Messgerätes</div>
      <div class="field-grid">
        ${protocol.person_type === 'company' 
          ? `${renderField('Firmenname', protocol.company_name)}
             ${renderField('Ansprechsperson', protocol.contact_person)}`
          : renderField('Name', protocol.person_name)
        }
        ${renderField('Strasse / Nr.', protocol.street)}
        ${renderField('Zusatz', protocol.additional_info)}
        ${renderField('PLZ', protocol.postal_code)}
        ${renderField('Ort', protocol.city)}
        ${renderField('Telefon', protocol.phone)}
        ${renderField('E-Mail', protocol.email)}
      </div>
    </div>

    ${oldMeter ? `
    <div class="section">
      <div class="section-title">Altes Messgerät – Daten vor dem Austausch</div>
      <div class="field-grid">
        ${renderField('Hersteller', oldMeter.manufacturer)}
        ${renderField('Zähler-Nr.', oldMeter.meter_number)}
        ${renderField('Dimension', oldMeter.dimension)}
        ${renderField('Einbaulänge', oldMeter.installation_length)}
        ${renderField('Dauerdurchfluss', oldMeter.flow_rate)}
        ${renderField('Zählerstand', oldMeter.meter_reading ? `${oldMeter.meter_reading} m³` : null)}
        ${renderField('Einlaufstrecke', oldMeter.inlet_material ? `${oldMeter.inlet_material}${oldMeter.inlet_size ? ` - ${oldMeter.inlet_size}` : ''}` : null)}
        ${renderField('Auslaufstrecke', oldMeter.outlet_material ? `${oldMeter.outlet_material}${oldMeter.outlet_size ? ` - ${oldMeter.outlet_size}` : ''}` : null)}
        ${renderField('Einbauart', oldMeter.installation_type)}
        ${renderField('Einbauort', oldMeter.installation_location)}
        ${renderField('Jahrgang', oldMeter.year_vintage)}
        ${renderField('Ausbaudatum', oldMeter.removal_date)}
      </div>
    </div>
    ` : ''}

    ${newMeter ? `
    <div class="section">
      <div class="section-title">Neues Messgerät – Daten nach dem Austausch</div>
      <div class="field-grid">
        ${renderField('Hersteller', newMeter.manufacturer)}
        ${renderField('Zähler-Nr.', newMeter.meter_number)}
        ${renderField('Dimension', newMeter.dimension)}
        ${renderField('Einbaulänge', newMeter.installation_length)}
        ${renderField('Dauerdurchfluss', newMeter.flow_rate)}
        ${renderField('Zählerstand', newMeter.meter_reading ? `${newMeter.meter_reading} m³` : null)}
        ${renderField('Einlaufstrecke', newMeter.inlet_material ? `${newMeter.inlet_material}${newMeter.inlet_size ? ` - ${newMeter.inlet_size}` : ''}` : null)}
        ${renderField('Auslaufstrecke', newMeter.outlet_material ? `${newMeter.outlet_material}${newMeter.outlet_size ? ` - ${newMeter.outlet_size}` : ''}` : null)}
        ${renderField('Einbauart', newMeter.installation_type)}
        ${renderField('Einbauort', newMeter.installation_location)}
        ${renderField('Jahrgang', newMeter.year_vintage)}
        ${renderField('Einbaudatum', newMeter.installation_date)}
      </div>
    </div>
    ` : ''}

    ${protocol.notes ? `
    <div class="section">
      <div class="section-title">Bemerkungen</div>
      <div class="notes-box">${protocol.notes}</div>
    </div>
    ` : ''}

    <div class="footer">
      <span>bauprodukt.ch</span>
      <span>Austauschprotokoll Wasserzähler</span>
    </div>
  </div>
</body>
</html>`
}

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

    // Generate HTML
    const html = generateProtocolHTML(protocol)

    // Return HTML response
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Vorschau' },
      { status: 500 }
    )
  }
}

