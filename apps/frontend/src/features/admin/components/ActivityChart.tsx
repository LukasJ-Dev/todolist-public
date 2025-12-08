import { ActivityMetrics } from '../services/adminApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/UI/card';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Spinner } from '../../../components/UI/spinner';

interface ActivityChartProps {
  activity: ActivityMetrics;
  isLoading: boolean;
}

export function ActivityChart({ activity, isLoading }: ActivityChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for Recharts
  const chartData = activity.growthData.map((day) => ({
    date: format(new Date(day.date), 'MMM d'),
    fullDate: day.date,
    Users: day.users,
    Tasks: day.tasks,
    Todolists: day.todolists,
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Insights</CardTitle>
        <CardDescription>Growth metrics over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">New Users (7d)</div>
              <div className="text-2xl font-bold">{activity.newUsers7Days}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">New Users (30d)</div>
              <div className="text-2xl font-bold">{activity.newUsers30Days}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Tasks Created (7d)</div>
              <div className="text-2xl font-bold">{activity.tasksCreated7Days}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Tasks Created (30d)</div>
              <div className="text-2xl font-bold">{activity.tasksCreated30Days}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Todolists (7d)</div>
              <div className="text-2xl font-bold">{activity.todolistsCreated7Days}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Todolists (30d)</div>
              <div className="text-2xl font-bold">{activity.todolistsCreated30Days}</div>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Daily Growth (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="square"
                />
                <Bar
                  dataKey="Users"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Users"
                />
                <Bar
                  dataKey="Tasks"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Tasks"
                />
                <Bar
                  dataKey="Todolists"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  name="Todolists"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
