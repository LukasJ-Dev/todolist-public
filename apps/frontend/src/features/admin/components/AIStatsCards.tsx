import { AIStats } from '../services/adminApi';
import { StatsCard } from './StatsCard';
import { MessageSquare, Users, Wrench, Brain, TrendingUp } from 'lucide-react';

interface AIStatsCardsProps {
  stats: AIStats;
  isLoading: boolean;
}

export function AIStatsCards({ stats, isLoading }: AIStatsCardsProps) {
  if (isLoading) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatsCard
        title="Total Conversations"
        value={stats.totalConversations}
        icon={<MessageSquare className="h-4 w-4" />}
        description={`${stats.conversations7Days} new (7d)`}
      />
      <StatsCard
        title="Total Messages"
        value={stats.totalMessages}
        icon={<MessageSquare className="h-4 w-4" />}
        description={`${stats.messages7Days} sent (7d)`}
      />
      <StatsCard
        title="AI Users"
        value={stats.uniqueUsers}
        icon={<Users className="h-4 w-4" />}
        description="Active users"
      />
      <StatsCard
        title="Tool Calls"
        value={stats.totalToolCalls}
        icon={<Wrench className="h-4 w-4" />}
        description="Total actions"
      />
      <StatsCard
        title="Memories"
        value={stats.totalMemories}
        icon={<Brain className="h-4 w-4" />}
        description={`Avg ${stats.averageMessagesPerConversation.toFixed(1)} msgs/conv`}
      />
    </div>
  );
}

