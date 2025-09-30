import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // 调用后端API获取线程列表
    const response = await fetch('http://localhost:4000/threads', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // 提取线程ID列表
    const threadIds = data.data?.threads?.map((thread: any) => ({
      id: thread.id,
      contactName: thread.contact?.name || '未知联系人',
      contactPhone: thread.contact?.phoneE164 || '未知号码',
      aiEnabled: thread.aiEnabled,
      messagesCount: thread.messagesCount
    })) || [];

    return NextResponse.json({
      success: true,
      count: threadIds.length,
      threads: threadIds
    });

  } catch (error) {
    console.error('获取线程ID失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取线程ID失败'
    }, { status: 500 });
  }
}
