import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;
    
    // Get API configuration from headers
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    const endpoint = request.headers.get('X-API-Endpoint');
    const mjEndpointPath = request.headers.get('X-MJ-Endpoint-Path');
    
    if (!apiKey || !endpoint || !mjEndpointPath) {
      return NextResponse.json({ error: 'Missing API configuration for MaaS-MJ' }, { status: 400 });
    }

    console.log('MaaS-MJ generation request:', { prompt });

    // Step 1: Create MJ diffusion task
    const createResponse = await fetch(`${endpoint}/${mjEndpointPath}/tob/diffusion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text: prompt
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('MaaS-MJ create task error:', createResponse.status, errorText);
      throw new Error(`创建MJ任务失败 (${createResponse.status}): ${errorText}`);
    }

    const createData = await createResponse.json();
    console.log('MaaS-MJ create task response:', createData);
    
    const taskId = createData.id;
    
    if (!taskId) {
      throw new Error('未获取到任务ID');
    }

    // Step 2: Poll for completion (with timeout)
    const maxAttempts = 60; // 最多等待5分钟 (60 * 5秒)
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
      attempts++;
      
      try {
        const statusResponse = await fetch(`${endpoint}/${mjEndpointPath}/tob/job/${taskId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (!statusResponse.ok) {
          console.error('MaaS-MJ status check error:', statusResponse.status);
          continue;
        }

        const statusData = await statusResponse.json();
        console.log(`MaaS-MJ status check (${attempts}/${maxAttempts}):`, statusData);
        
        // 检查任务状态
        if (statusData.status === 2) { // 执行成功
          if (statusData.urls && statusData.urls.length > 0) {
            // 返回OpenAI格式的响应
            return NextResponse.json({
              created: Math.floor(Date.now() / 1000),
              data: statusData.urls.map((url: string, index: number) => ({
                url: url,
                revised_prompt: statusData.text
              }))
            });
          }
        } else if (statusData.status === 3) { // 失败
          throw new Error(`MJ任务执行失败: ${statusData.comment || '未知错误'}`);
        }
        // status 0 或 1 继续等待
        
      } catch (error) {
        console.error('MaaS-MJ status check error:', error);
        continue;
      }
    }
    
    // 超时处理
    throw new Error('MJ任务执行超时，请稍后查看结果或重试');
    
  } catch (error) {
    console.error('MaaS-MJ generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'MJ image generation failed' 
      },
      { status: 500 }
    );
  }
}