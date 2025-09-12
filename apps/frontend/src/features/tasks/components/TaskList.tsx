import TaskCardList from './TaskCardList';
import { useGetAllTasksQuery } from '../services/taskApi';
import { Input } from '../../../components/UI/input';
import { useState } from 'react';

const AllTasks = () => {
  const { data: tasks } = useGetAllTasksQuery();

  const [search, setSearch] = useState('');

  const filteredTasks = tasks?.filter((task) =>
    task.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-row gap-2 w-full justify-center p-6 pt-4 md:pt-10">
      <div className="flex flex-col gap-2 p-2 w-full max-w-5xl">
        <div className="bg-blue-50/30 rounded-lg p-4 border border-blue-100/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
            <p className="text-2xl font-semibold text-blue-900">Inbox</p>
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex flex-row gap-4">
            <Input
              placeholder="Search"
              className="w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TaskCardList tasks={filteredTasks || []} />
      </div>
    </div>
  );
};

export default AllTasks;
