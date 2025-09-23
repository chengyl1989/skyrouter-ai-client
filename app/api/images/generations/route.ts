import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const apiEndpoint = request.headers.get('x-api-endpoint') || 'https://genaiapi.cloudsway.net';

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    console.log('Proxying image generation request to:', `${apiEndpoint}/v1/images/generations`);
    console.log('Request body:', body);

    const response = await fetch(`${apiEndpoint}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const errorText = await response.text();
          errorData = { message: errorText };
        }
      } catch (parseError) {
        const errorText = await response.text();
        errorData = { message: errorText };
      }

      console.error('API error response:', errorData);

      // Handle specific DALL-E-3 errors
      if (response.status === 400) {
        // Check for content policy violation
        const errorMessage = errorData.error?.message || errorData.message || '';
        const errorCode = errorData.error?.code || errorData.code || '';
        
        if (errorCode === 'content_policy_violation' || errorMessage.includes('content_policy_violation')) {
          return NextResponse.json({
            error: '内容安全检查失败',
            message: '您的图像生成请求被安全系统拒绝。请修改您的描述，避免使用可能违反内容政策的词汇。',
            suggestions: [
              '使用更加具体和积极的描述词汇',
              '避免涉及暴力、成人内容或其他敏感主题',
              '尝试用更中性的表达方式重新描述您想要的图像',
              '确保描述内容符合AI生成图像的使用规范'
            ],
            type: 'content_policy_violation'
          }, { status: 400 });
        }

        if (errorMessage.includes('billing') || errorMessage.includes('quota')) {
          return NextResponse.json({
            error: '账户配额不足',
            message: '当前API账户的图像生成配额已用完，请检查您的账户余额或升级套餐。',
            type: 'quota_exceeded'
          }, { status: 400 });
        }

        if (errorMessage.includes('invalid_request') || errorMessage.includes('invalid prompt')) {
          return NextResponse.json({
            error: '请求参数无效',
            message: '图像生成请求的参数有误，请检查您的输入内容。',
            details: errorMessage,
            type: 'invalid_request'
          }, { status: 400 });
        }
      }

      // Handle rate limiting
      if (response.status === 429) {
        return NextResponse.json({
          error: '请求频率过高',
          message: '图像生成请求过于频繁，请稍后再试。',
          type: 'rate_limit_exceeded'
        }, { status: 429 });
      }

      // Handle authentication errors
      if (response.status === 401) {
        return NextResponse.json({
          error: 'API密钥验证失败',
          message: '请检查您的API密钥是否正确配置。',
          type: 'authentication_failed'
        }, { status: 401 });
      }

      // Handle server errors
      if (response.status >= 500) {
        return NextResponse.json({
          error: '服务器错误',
          message: '图像生成服务暂时不可用，请稍后重试。',
          type: 'server_error'
        }, { status: response.status });
      }

      // Generic error fallback
      return NextResponse.json({
        error: `图像生成失败: ${response.status} ${response.statusText}`,
        message: errorData.error?.message || errorData.message || '未知错误',
        details: errorData,
        type: 'api_error'
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Success response data:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}