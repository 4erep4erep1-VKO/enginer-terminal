/**
 * Next.js App Router Route Segment Configuration for Chat API
 * Provides maxDuration, dynamic routing, retry logic, and Vasilich fallback handler for 503.
 */

export const maxDuration = 30; // seconds
export const dynamic = 'force-dynamic';

const VASILICH_503_MESSAGE = "Запрос выработался с задержкой или пропала связь. Попробуй повторить еще раз!";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Forward to internal service handler
    const targetUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
    
    let response: Response;
    try {
      response = await fetch(`${targetUrl}/api/rag/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // Automatic retry (1 attempt) with 1.5s delay if 503 / 502 / 504
      if (response.status === 503 || response.status === 502 || response.status === 504) {
        console.warn(`[chat/route] Received HTTP ${response.status}, retrying after 1.5s...`);
        await new Promise(r => setTimeout(r, 1500));
        response = await fetch(`${targetUrl}/api/rag/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      }
    } catch (networkErr: any) {
      console.warn('[chat/route] Network error, retrying after 1.5s...', networkErr);
      await new Promise(r => setTimeout(r, 1500));
      response = await fetch(`${targetUrl}/api/rag/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    if (response.status === 503) {
      return new Response(
        JSON.stringify({
          answer: VASILICH_503_MESSAGE,
          message: VASILICH_503_MESSAGE,
          diagnosticResponse: {
            summary: VASILICH_503_MESSAGE,
            severity: "warning"
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[chat/route] Handled error:', error);
    return new Response(
      JSON.stringify({ 
        answer: VASILICH_503_MESSAGE,
        message: VASILICH_503_MESSAGE,
        error: 'Chat API route error', 
        details: error?.message 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
