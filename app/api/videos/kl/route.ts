import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model_name, prompt, image } = body;
    
    // Get API configuration from headers
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    const endpoint = request.headers.get('X-API-Endpoint');
    const klEndpointPath = request.headers.get('X-KL-Endpoint-Path');
    
    if (!apiKey || !endpoint || !klEndpointPath) {
      return NextResponse.json({ error: 'Missing API configuration for MaaS-KL' }, { status: 400 });
    }

    console.log('MaaS-KL video generation request:', { model_name, prompt, image });

    // 构建完整的API endpoint
    let apiEndpoint;
    if (klEndpointPath.startsWith('http')) {
      // 用户输入了完整URL：https://genaiapi.cloudsway.net/v1/ai/alhWUjkMbVNjpfNF
      if (image) {
        apiEndpoint = `${klEndpointPath}/kling/videos/image2video`;
      } else {
        apiEndpoint = `${klEndpointPath}/kling/videos/text2video`;
      }
    } else {
      // 用户只输入了ID：alhWUjkMbVNjpfNF
      if (image) {
        apiEndpoint = `${endpoint}/v1/ai/${klEndpointPath}/kling/videos/image2video`;
      } else {
        apiEndpoint = `${endpoint}/v1/ai/${klEndpointPath}/kling/videos/text2video`;
      }
    }
    
    console.log('Final KL API endpoint:', apiEndpoint);
    
    // 构建请求数据
    let requestData: any = {
      model_name: model_name || 'kling-v1'
    };

    if (prompt?.trim()) {
      requestData.prompt = prompt;
    }

    if (image) {
      // 如果是图片数据，需要处理base64格式
      if (image.startsWith('data:')) {
        // 如果是base64格式，需要转换为URL或者按照API要求处理
        // 这里假设API接受base64格式，如果不接受需要先上传到临时存储
        requestData.image = image;
      } else {
        // 假设是URL
        requestData.image = image;
      }
    }

    console.log('KL request data:', JSON.stringify(requestData, null, 2));

    // Step 1: 创建视频生成任务
    const createResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestData),
    });

    let createData;
    try {
      createData = await createResponse.json();
    } catch (parseError) {
      console.error('Failed to parse KL response:', parseError);
      throw new Error(`无法解析KL API响应: ${parseError}`);
    }

    if (!createResponse.ok) {
      console.error('KL create task error:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        error: createData,
        endpoint: apiEndpoint,
        requestData: requestData
      });
      
      let errorMessage = `创建KL视频任务失败 (${createResponse.status})`;
      if (createData.message) {
        errorMessage += `: ${createData.message}`;
      }
      
      throw new Error(errorMessage);
    }

    console.log('KL create task response:', createData);
    
    // 获取任务ID
    const taskId = createData.data?.task_id;
    
    if (!taskId) {
      console.error('No task ID found in KL response:', createData);
      throw new Error(`未获取到KL任务ID，响应结构: ${JSON.stringify(createData)}`);
    }

    // Step 2: 轮询任务状态 (最多等待10分钟)
    const maxAttempts = 120; // 最多等待10分钟 (120 * 5秒)
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
      attempts++;
      
      try {
        // 构建状态检查URL
        let statusUrl;
        if (klEndpointPath.startsWith('http')) {
          if (image) {
            statusUrl = `${klEndpointPath}/kling/videos/image2video/${taskId}`;
          } else {
            statusUrl = `${klEndpointPath}/kling/videos/text2video/${taskId}`;
          }
        } else {
          if (image) {
            statusUrl = `${endpoint}/v1/ai/${klEndpointPath}/kling/videos/image2video/${taskId}`;
          } else {
            statusUrl = `${endpoint}/v1/ai/${klEndpointPath}/kling/videos/text2video/${taskId}`;
          }
        }
        
        console.log('KL status check URL:', statusUrl);
        
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (!statusResponse.ok) {
          console.error('KL status check error:', statusResponse.status);
          continue;
        }

        const statusData = await statusResponse.json();
        console.log(`KL status check (${attempts}/${maxAttempts}):`, statusData);
        
        // 检查任务状态
        const taskStatus = statusData.data?.task_status;
        
        if (taskStatus === 'succeed') {
          // 获取视频URL
          const videos = statusData.data?.task_result?.videos;
          console.log('KL task succeeded, videos array:', videos);
          if (videos && videos.length > 0) {
            const videoUrl = videos[0].url;
            console.log('KL video URL:', videoUrl);
            
            // 返回OpenAI格式的响应
            return NextResponse.json({
              created: Math.floor(Date.now() / 1000),
              data: [{
                url: videoUrl,
                revised_prompt: prompt || '视频生成'
              }]
            });
          } else {
            throw new Error('KL任务成功但未获取到视频URL');
          }
        } else if (taskStatus === 'failed') {
          const errorMsg = statusData.data?.task_status_msg || 'Unknown error';
          throw new Error(`KL视频任务执行失败: ${errorMsg}`);
        }
        
        // 其他状态继续等待: submitted, processing
        console.log(`KL task still in progress, status: ${taskStatus}`);
        
      } catch (error) {
        console.error('KL status check error:', error);
        continue;
      }
    }
    
    // 超时处理
    throw new Error('KL视频任务执行超时，请稍后查看结果或重试');
    
  } catch (error) {
    console.error('KL video generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'KL video generation failed' 
      },
      { status: 500 }
    );
  }
}