import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scriptUrl = searchParams.get('scriptUrl');
  const action = searchParams.get('action') || 'ping';

  if (!scriptUrl) {
    return NextResponse.json(
      { success: false, error: 'URL Google Apps Script tidak disertakan.' },
      { status: 400 }
    );
  }

  if (!scriptUrl.startsWith('https://script.google.com/')) {
    return NextResponse.json(
      { success: false, error: 'URL harus berformat https://script.google.com/...' },
      { status: 400 }
    );
  }

  try {
    const targetUrl = new URL(scriptUrl);
    targetUrl.searchParams.set('action', action);

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Google Apps Script merespons dengan HTTP ${response.status}: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Respons dari Google Apps Script bukan format JSON valid.',
          rawResponse: text.slice(0, 300),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Koneksi ke Google Apps Script gagal.';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scriptUrl, action, sheet } = body;

    if (!scriptUrl) {
      return NextResponse.json(
        { success: false, error: 'URL Google Apps Script tidak disertakan.' },
        { status: 400 }
      );
    }

    if (!scriptUrl.startsWith('https://script.google.com/')) {
      return NextResponse.json(
        { success: false, error: 'URL harus berformat https://script.google.com/...' },
        { status: 400 }
      );
    }

    // Forward the payload directly to Google Apps Script
    const response = await fetch(scriptUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Google Apps Script mengembalikan HTTP ${response.status}`,
        },
        { status: response.status }
      );
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // In case Google Apps Script returns standard text/HTML
      return NextResponse.json({
        success: true,
        status: 'success',
        rawText: text.slice(0, 200),
      });
    }

    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Gagal mengirim data ke Google Apps Script.';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
