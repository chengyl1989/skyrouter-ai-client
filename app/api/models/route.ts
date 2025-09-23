import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiEndpoint = request.headers.get('x-api-endpoint') || 'https://genaiapi.cloudsway.net';

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    console.log('Fetching models from:', `${apiEndpoint}/v1/models`);

    const response = await fetch(`${apiEndpoint}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    console.log('Models response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Models API error response:', errorText);
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Models data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Models proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}