/**
 * Next.js App Router Route Segment Configuration for Chat API
 * Provides maxDuration, dynamic routing, and proxy/fallback handler.
 */

export const maxDuration = 30; // seconds
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Forward to internal service handler if needed
    const targetUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
    const response = await fetch(`${targetUrl}/api/rag/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Chat API route error', details: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
