import TaskCardList from './task-card-list';
import { useGetAllTasksQuery } from '../services/taskApi';
import { Input } from './UI/input';
import { useState } from 'react';

const AllTasks = () => {
  const { data: tasks } = useGetAllTasksQuery();

  const [search, setSearch] = useState('');

  const filteredTasks = tasks?.filter((task) =>
    task.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-row gap-2 w-full justify-center p-6 pt-10">
      <div className="flex flex-col gap-2 p-2 w-full max-w-5xl">
        <div className="flex flex-col justify-between">
          <p className="text-2xl">Inbox</p>
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
