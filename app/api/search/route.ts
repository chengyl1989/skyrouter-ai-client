import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, model, searchParams } = body;
    
    // Get API configuration from headers
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    const endpoint = request.headers.get('X-API-Endpoint');
    const searchEndpointId = request.headers.get('X-Search-Endpoint-Id');
    
    if (!apiKey || !endpoint) {
      return NextResponse.json({ error: 'Missing API configuration' }, { status: 400 });
    }

    if (!query || !model) {
      return NextResponse.json({ error: 'Missing query or model' }, { status: 400 });
    }

    if (!searchEndpointId) {
      return NextResponse.json({ 
        error: 'Missing search endpoint configuration. Please configure the search endpoint ID in settings.' 
      }, { status: 400 });
    }

    console.log('Search request:', { model, query, searchEndpointId });

    // 根据模型选择搜索类型和构建URL
    let searchUrl: string;
    let searchType: string;
    
    if (model === 'SmartSearch') {
      searchType = 'smart';
      searchUrl = `https://searchapi.cloudsway.net/search/${searchEndpointId}/smart`;
    } else if (model === 'FullTextSearch') {
      searchType = 'fulltext';
      searchUrl = `https://searchapi.cloudsway.net/search/${searchEndpointId}/full`;
    } else {
      return NextResponse.json({ error: 'Unsupported search model' }, { status: 400 });
    }

    // 构建搜索参数
    const urlSearchParams = new URLSearchParams({
      q: query,
      safeSearch: searchParams?.safeSearch || 'Moderate',
      count: searchParams?.count || '10'
    });

    // 添加可选参数
    if (searchParams?.freshness) {
      urlSearchParams.append('freshness', searchParams.freshness);
    }
    if (searchParams?.offset && searchParams.offset !== '0') {
      urlSearchParams.append('offset', searchParams.offset);
    }
    if (searchParams?.mkt) {
      urlSearchParams.append('mkt', searchParams.mkt);
    }
    if (searchParams?.cc) {
      urlSearchParams.append('cc', searchParams.cc);
    }
    if (searchParams?.setLang) {
      urlSearchParams.append('setLang', searchParams.setLang);
    }

    const fullUrl = `${searchUrl}?${urlSearchParams.toString()}`;
    console.log('Search URL:', fullUrl);

    // 调用搜索API
    const searchResponse = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'pragma': 'no-cache'
      },
    });

    if (!searchResponse.ok) {
      const errorData = await searchResponse.text();
      console.error('Search API error:', errorData);
      throw new Error(`搜索请求失败: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search API response:', searchData);

    // 处理搜索结果
    let content = '';
    let results: any[] = [];

    if (searchData.webPages && searchData.webPages.value) {
      const webPages = searchData.webPages.value;
      
      // 根据搜索类型生成不同的内容摘要
      if (searchType === 'smart') {
        // 智能搜索：生成简洁的结果概述
        content = `找到相关结果约 ${webPages.length} 个，以下是按相关度排序的结果：`;
      } else {
        // 全文搜索：生成简洁的结果概述
        content = `找到相关结果约 ${webPages.length} 个，以下是按关键词匹配度排序的结果：`;
      }
      
      // 构建结果列表供UI显示
      results = webPages.map((item: any, index: number) => ({
        title: item.name || item.title || 'Unknown',
        url: item.url,
        displayUrl: item.displayUrl || item.url,
        snippet: item.snippet || item.content || 'No description',
        content: item.content || item.snippet || 'No description',
        fullContent: item.fullContent || item.content || '',
        siteName: item.siteName || (item.url ? new URL(item.url).hostname : ''),
        datePublished: item.datePublished || item.dateLastCrawled || '',
        dateLastCrawled: item.dateLastCrawled || '',
        thumbnailUrl: item.thumbnailUrl || '',
        // 排序和相关性信息
        relevanceScore: webPages.length - index, // 模拟相关性评分
        // 添加搜索类型标识
        searchType: searchType,
        isSmartMatch: searchType === 'smart',
        isFulltextMatch: searchType === 'fulltext',
        // 添加索引信息用于显示
        resultIndex: index + 1,
        // 如果有偏移量，调整实际位置
        globalIndex: (parseInt(searchParams?.offset || '0') + index + 1)
      }));
    } else {
      content = searchType === 'smart' 
        ? '🧠 智能搜索完成，但AI未找到相关的语义匹配内容。建议尝试调整关键词或使用全文搜索模式。'
        : '📄 全文搜索完成，但未找到包含指定关键词的内容。建议尝试其他关键词或使用智能搜索模式。';
    }

    // 返回标准化的搜索结果
    return NextResponse.json({
      query,
      model,
      content,
      results,
      searchType,
      searchEndpointId,
      searchParams: searchParams || {},
      total: results.length,
      timestamp: new Date().toISOString(),
      success: true
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Search failed',
        success: false
      },
      { status: 500 }
    );
  }
}