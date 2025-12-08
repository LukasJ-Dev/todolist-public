import { DatabaseStats as DatabaseStatsType } from '../services/adminApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/UI/card';
import { StatsCard } from './StatsCard';
import { Spinner } from '../../../components/UI/spinner';
import { Database, HardDrive, FileText, Layers } from 'lucide-react';

interface DatabaseStatsProps {
  stats: DatabaseStatsType;
  isLoading: boolean;
}

// Helper function to format bytes to human-readable format
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function DatabaseStats({ stats, isLoading }: DatabaseStatsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Statistics</CardTitle>
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
        <CardTitle>Database Statistics</CardTitle>
        <CardDescription>
          MongoDB database size and storage metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Size"
              value={formatBytes(stats.totalSize)}
              icon={<Database className="h-4 w-4" />}
              description="Storage + Indexes"
            />
            <StatsCard
              title="Data Size"
              value={formatBytes(stats.dataSize)}
              icon={<FileText className="h-4 w-4" />}
              description="Uncompressed data"
            />
            <StatsCard
              title="Storage Size"
              value={formatBytes(stats.storageSize)}
              icon={<HardDrive className="h-4 w-4" />}
              description="On-disk size"
            />
            <StatsCard
              title="Index Size"
              value={formatBytes(stats.indexSize)}
              icon={<Layers className="h-4 w-4" />}
              description="All indexes"
            />
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Collections</div>
              <div className="text-2xl font-bold">{stats.collections}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">
                Total Documents
              </div>
              <div className="text-2xl font-bold">
                {stats.objects.toLocaleString()}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">
                Avg Object Size
              </div>
              <div className="text-2xl font-bold">
                {formatBytes(stats.avgObjSize)}
              </div>
            </div>
          </div>

          {/* Collection Breakdown */}
          <div>
            <h3 className="text-sm font-medium mb-3">Size by Collection</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Collection</th>
                    <th className="text-left p-2 font-medium">Documents</th>
                    <th className="text-left p-2 font-medium">Data Size</th>
                    <th className="text-left p-2 font-medium">Storage Size</th>
                    <th className="text-left p-2 font-medium">Index Size</th>
                    <th className="text-left p-2 font-medium">Total Size</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.collectionStats.map((collection) => (
                    <tr
                      key={collection.name}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-2 font-medium">
                        {collection.displayName}
                      </td>
                      <td className="p-2">
                        {collection.count.toLocaleString()}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {formatBytes(collection.dataSize)}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {formatBytes(collection.storageSize)}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {formatBytes(collection.indexSize)}
                      </td>
                      <td className="p-2 font-semibold">
                        {formatBytes(collection.totalSize)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
