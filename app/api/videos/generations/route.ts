import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, image, audio, ...otherParams } = body;
    
    // Get API configuration from headers
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    const endpoint = request.headers.get('X-API-Endpoint');
    
    if (!apiKey || !endpoint) {
      return NextResponse.json({ error: 'Missing API configuration' }, { status: 400 });
    }

    // Build request payload based on input type
    let requestData: any = {
      model,
      ...otherParams
    };

    if (prompt) {
      requestData.prompt = prompt;
    }
    
    if (image) {
      requestData.image = image;
    }
    
    if (audio) {
      requestData.audio = audio;
    }

    console.log('Video generation request:', requestData);

    const response = await fetch(`${endpoint}/v1/videos/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Video generation API error:', response.status, errorText);
      throw new Error(`API请求失败 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('Video generation response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Video generation failed' 
      },
      { status: 500 }
    );
  }
}