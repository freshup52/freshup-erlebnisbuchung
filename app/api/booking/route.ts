export async function POST(request: Request) {
    try {
      const data = await request.json()
  
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbxnxy-Y9GgffR8m94Z1B8M_DLOp2o6fctKuYjGETvaBS5JivkzPY6FzFHLM2oLRAYQc/exec', // ⬅️ dein neuer Link
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )
  
      const result = await response.json()
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('API error:', error)
      return new Response(
        JSON.stringify({ status: 'error', message: 'Interner API-Fehler' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }
  