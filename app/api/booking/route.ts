export async function POST(request: Request) {
    try {
      const data = await request.json();
  
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbxqPJZMA1k4h8EkKSOOYSzEGc2JzlEw6_rnqjvNDlJoEe9Gdd2A3Eb_s6dNnae-1T9F/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
  
      const result = await response.json();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('API error:', error);
      return new Response(
        JSON.stringify({ status: 'error', message: 'Interner API-Fehler' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
  
  function formatDate(value: any): string {
    const date = new Date(value);
    return date.toISOString().split('T')[0]; // z.B. "2025-05-17"
  }
  
  function formatTime(value: any): string {
    if (typeof value === 'string') {
      // z.B. "08:00:00" → "08:00"
      return value.slice(0, 5);
    }
  
    if (typeof value === 'number') {
      // z.B. Excel-Zeitwert (z.B. 0.333...) für 08:00 Uhr
      const totalMinutes = Math.round(value * 24 * 60);
      const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const minutes = (totalMinutes % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  
    if (typeof value === 'object' && value instanceof Date) {
      return value.toTimeString().slice(0, 5);
    }
  
    // 🛠️ Sonderfall: Google Sheets liefert manchmal eine Pseudo-Date im Format: { v: Date(2025,4,17,8,0,0) }
    if (typeof value === 'object' && value?.getHours) {
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  
    return '';
  }
  
  
  export async function GET() {
    try {
      const sheetId = '1lO0Hm740XbVbVulF6bx_UtklvGH3H2ey1I-UBblW1oQ';
      const sheetName = 'Erlebnisbuchung';
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  
      const response = await fetch(url);
      const text = await response.text();
  
      const json = JSON.parse(text.substring(47).slice(0, -2));
      const rows = json.table.rows;
  
      const bookings = rows.map((row: any) => ({
        fahrzeug: row.c[0]?.v || '',
        flugart: row.c[1]?.v || '',
        datum: row.c[2]?.v ? formatDate(row.c[2].v) : '',
        uhrzeit: row.c[3]?.v ? formatTime(row.c[3].v) : '',
      }));
  
      return new Response(JSON.stringify(bookings), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('GET error:', error);
      return new Response(
        JSON.stringify({ status: 'error', message: 'Fehler beim Laden der Buchungen' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
  