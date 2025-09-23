import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, image, audio } = body;
    
    // Get API configuration from headers
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    const endpoint = request.headers.get('X-API-Endpoint');
    const hlEndpointPath = request.headers.get('X-HL-Endpoint-Path');
    
    if (!apiKey || !endpoint || !hlEndpointPath) {
      return NextResponse.json({ error: 'Missing API configuration for MaaS-HL' }, { status: 400 });
    }

    console.log('MaaS-HL video generation request - v3:', { model, prompt, image, audio });

    // 构建请求数据
    let requestData: any = {
      model: model,
      promptOptimizer: true
    };

    // 根据用户输入构建API端点
    const modelId = model.toLowerCase();
    console.log('Processing model:', model, 'lowercase:', modelId);
    console.log('Received hlEndpointPath:', hlEndpointPath);
    console.log('Received endpoint:', endpoint);
    
    // 构建完整的API endpoint
    // 如果用户输入的是完整路径，直接使用；如果只是ID，则拼接完整路径
    let apiEndpoint;
    if (hlEndpointPath.startsWith('http')) {
      // 用户输入了完整URL：https://genaiapi.cloudsway.net/v1/ai/UfRLJwuMWPdfKWQg
      apiEndpoint = `${hlEndpointPath}/hailuo/video/generate`;
    } else {
      // 用户只输入了ID：UfRLJwuMWPdfKWQg
      apiEndpoint = `${endpoint}/v1/ai/${hlEndpointPath}/hailuo/video/generate`;
    }
    
    console.log('Final API endpoint:', apiEndpoint);
    
    if (modelId.includes('t2v')) {
      // 文生视频 (Text to Video) - 根据官方文档
      if (!prompt?.trim()) {
        return NextResponse.json({ error: 'T2V模型需要提供prompt' }, { status: 400 });
      }
      requestData.prompt = prompt;
      // T2V模型支持可选的firstFrameImage参数，但我们暂时不提供
      if (image) {
        requestData.firstFrameImage = image;
      }
    } else {
      // 其他模型现在不支持，但保留兼容性
      if (!prompt?.trim()) {
        return NextResponse.json({ error: '需要提供prompt' }, { status: 400 });
      }
      requestData.prompt = prompt;
    }

    console.log('MaaS-HL request data:', JSON.stringify(requestData, null, 2));
    console.log('Endpoint URL:', apiEndpoint);

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
      console.error('Failed to parse response:', parseError);
      throw new Error(`无法解析API响应: ${parseError}`);
    }

    if (!createResponse.ok) {
      let errorText;
      try {
        errorText = JSON.stringify(createData);
      } catch {
        errorText = String(createData);
      }
      console.error('MaaS-HL create task error:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        error: errorText,
        model: model,
        endpoint: apiEndpoint,
        requestData: requestData
      });
      
      // 尝试解析错误响应
      let errorMessage = `创建HL视频任务失败 (${createResponse.status})`;
      try {
        if (createData.error) {
          errorMessage += `: ${createData.error.message || createData.error}`;
        } else if (createData.message) {
          errorMessage += `: ${createData.message}`;
        } else {
          errorMessage += `: ${errorText}`;
        }
      } catch {
        errorMessage += `: ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    // createData is already available from above
    console.log('MaaS-HL create task response:', {
      status: createResponse.status,
      data: createData,
      model: model,
      responseKeys: Object.keys(createData)
    });
    
    // 尝试多种可能的任务ID字段名
    const taskId = createData.taskId || 
                   createData.task_id || 
                   createData.id || 
                   createData.requestId || 
                   createData.data?.taskId || 
                   createData.data?.task_id || 
                   createData.data?.id ||
                   createData.result?.taskId ||
                   createData.result?.task_id ||
                   createData.result?.id;
    
    console.log('Task ID extraction:', {
      taskId: taskId,
      availableFields: Object.keys(createData),
      dataStructure: createData
    });
    
    if (!taskId) {
      console.error('No task ID found in response:', {
        response: createData,
        model: model,
        endpoint: apiEndpoint
      });
      
      // 检查是否有错误信息
      if (createData.error) {
        throw new Error(`API返回错误: ${createData.error.message || createData.error}`);
      }
      
      throw new Error(`未获取到任务ID，响应结构: ${JSON.stringify(createData)}`);
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
        if (hlEndpointPath.startsWith('http')) {
          statusUrl = `${hlEndpointPath}/hailuo/video/task/${taskId}`;
        } else {
          statusUrl = `${endpoint}/v1/ai/${hlEndpointPath}/hailuo/video/task/${taskId}`;
        }
        console.log('Status check URL:', statusUrl);
        
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (!statusResponse.ok) {
          console.error('MaaS-HL status check error:', statusResponse.status);
          continue;
        }

        const statusData = await statusResponse.json();
        console.log(`MaaS-HL status check (${attempts}/${maxAttempts}):`, statusData);
        
        // 检查任务状态 (根据官方文档)
        console.log('Status response structure:', statusData);
        
        // 如果响应包含错误，直接抛出错误
        if (statusData.error) {
          throw new Error(`HL视频任务失败: ${statusData.error.message || statusData.error.code || JSON.stringify(statusData.error)}`);
        }
        
        const taskStatus = (statusData.status || '').toUpperCase(); // 官方文档显示字段名为status
        console.log('Normalized task status:', taskStatus);
        
        if (taskStatus === 'SUCCESS') {
          // 获取文件ID (根据官方文档，字段名为fileId)
          const fileId = statusData.fileId || statusData.file_id;
          if (!fileId) {
            console.error('No fileId found in success response:', statusData);
            throw new Error('未获取到文件ID');
          }

          // Step 3: 获取视频URL
          let fileUrl;
          if (hlEndpointPath.startsWith('http')) {
            fileUrl = `${hlEndpointPath}/hailuo/video/file?taskId=${taskId}&fileId=${fileId}`;
          } else {
            fileUrl = `${endpoint}/v1/ai/${hlEndpointPath}/hailuo/video/file?taskId=${taskId}&fileId=${fileId}`;
          }
          console.log('File fetch URL:', fileUrl);
          
          const fileResponse = await fetch(fileUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });

          if (!fileResponse.ok) {
            throw new Error(`获取视频URL失败: ${fileResponse.status}`);
          }

          const fileData = await fileResponse.json();
          console.log('MaaS-HL file response:', fileData);

          if (fileData.mediaUrl) {
            // 返回OpenAI格式的响应
            return NextResponse.json({
              created: Math.floor(Date.now() / 1000),
              data: [{
                url: fileData.mediaUrl,
                revised_prompt: prompt || '视频生成'
              }]
            });
          }
        } else if (taskStatus === 'FAIL') {
          // 官方文档显示失败状态为'Fail'，但我们也检查'FAILED'以防万一
          throw new Error(`HL视频任务执行失败: ${statusData.failReason || statusData.message || 'Unknown error'}`);
        }
        // 其他状态继续等待: Preparing, Queueing, Processing
        console.log(`Task still in progress, status: ${statusData.status}`);
        
      } catch (error) {
        console.error('MaaS-HL status check error:', error);
        continue;
      }
    }
    
    // 超时处理
    throw new Error('HL视频任务执行超时，请稍后查看结果或重试');
    
  } catch (error) {
    console.error('MaaS-HL video generation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'HL video generation failed' 
      },
      { status: 500 }
    );
  }
}