import { notFound } from 'next/navigation';

import { ThreadView } from '@/components/threads/thread-view';
import { api } from '@/lib/api';

type ThreadPageParams = Promise<{ id: string }>;

export default async function ThreadDetailPage({ params }: { params: ThreadPageParams }) {
  const { id } = await params;

  try {
    const thread = await api.getThreadMessages(id);
    return <ThreadView initialThread={thread} />;
  } catch (error) {
    console.error(error);
    notFound();
  }
}
