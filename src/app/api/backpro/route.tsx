import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Extract the request body
    const body = await req.json();

    // Determine the target endpoint based on the body
    const endpoint = body.endpoint === 'chat'
      ? '/api/chat'
      : body.endpoint === 'image'
      ? '/api/image'
      : null;

    // If no valid endpoint is provided, return an error
    if (!endpoint) {
      return NextResponse.json({ error: 'Invalid endpoint specified' }, { status: 400 });
    }

    // Prepare the URL for the external API
    const apiUrl = process.env.NEXT_PUBLIC_CHAT_URL + `${endpoint}`; // Use backticks for string interpolation

    const apiHeaders = JSON.parse(process.env.NEXT_PUBLIC_API_HEADERS || '{}');

    // Forward the headers (you can customize which ones you need to forward)
    const headers = {
      'Content-Type': 'application/json',
      ...apiHeaders,
    };

    // Make the request to the external API
    const externalResponse = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    // Handle external API errors
    if (!externalResponse.ok) {
      return NextResponse.json({ error: `Error from external API: ${externalResponse.statusText}` }, { status: externalResponse.status });
    }

    // Return the response from the external API
    const responseData = await externalResponse.json();
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
