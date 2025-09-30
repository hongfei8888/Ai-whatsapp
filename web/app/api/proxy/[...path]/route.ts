import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const path = params.path.join('/');
    const url = `http://localhost:4000/${path}`;
    
    // 构建请求头
    const headers = new Headers();
    
    // 转发重要的请求头
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers.set('content-type', contentType);
    }
    
    const authorization = request.headers.get('authorization');
    if (authorization) {
      headers.set('authorization', authorization);
    }

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    // 对于POST/PUT请求，转发请求体
    if (method === 'POST' || method === 'PUT') {
      const body = await request.text();
      if (body) {
        requestOptions.body = body;
      }
    }

    // 转发查询参数
    const searchParams = request.nextUrl.searchParams;
    const finalUrl = searchParams.toString() 
      ? `${url}?${searchParams.toString()}`
      : url;

    const response = await fetch(finalUrl, requestOptions);
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Proxy ${method} error:`, error);
    return NextResponse.json(
      { error: `Failed to ${method.toLowerCase()} request` },
      { status: 500 }
    );
  }
}
