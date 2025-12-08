import { MemoryStats as MemoryStatsType } from '../services/adminApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/UI/card';
import { Spinner } from '../../../components/UI/spinner';
import { Brain, TrendingUp } from 'lucide-react';

interface MemoryStatsProps {
  memoryStats: MemoryStatsType;
  isLoading: boolean;
}

export function MemoryStats({ memoryStats, isLoading }: MemoryStatsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memory Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memory Statistics</CardTitle>
        <CardDescription>AI memory storage and usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Memories</div>
              <div className="text-2xl font-bold">{memoryStats.totalMemories}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
              <div className="text-2xl font-bold">
                {(memoryStats.averageConfidence * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Accesses</div>
              <div className="text-2xl font-bold">{memoryStats.totalAccessCount}</div>
            </div>
          </div>

          {/* By Category */}
          <div>
            <h3 className="text-sm font-medium mb-3">Memories by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Preference</div>
                <div className="text-xl font-bold">
                  {memoryStats.byCategory.preference}
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Fact</div>
                <div className="text-xl font-bold">
                  {memoryStats.byCategory.fact}
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Pattern</div>
                <div className="text-xl font-bold">
                  {memoryStats.byCategory.pattern}
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Context</div>
                <div className="text-xl font-bold">
                  {memoryStats.byCategory.context}
                </div>
              </div>
            </div>
          </div>

          {/* Most Accessed */}
          {memoryStats.mostAccessed.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Most Accessed Memories</h3>
              <div className="space-y-2">
                {memoryStats.mostAccessed.slice(0, 5).map((memory, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{memory.key}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {memory.value.length > 100
                            ? `${memory.value.substring(0, 100)}...`
                            : memory.value}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                            {memory.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold ml-4">
                        {memory.accessCount} accesses
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

