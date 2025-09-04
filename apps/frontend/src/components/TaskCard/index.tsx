import * as S from "./style";
import Checkbox from "../UI/Checkbox";
import { FaPen, FaTrash } from "react-icons/fa";
import IconButton from "../UI/IconButton";
import { TaskType } from "../../types";

interface Props {
  task: TaskType;
  onChecked: (checked: boolean, id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<Props> = ({ task, onChecked, onEdit, onDelete }) => {
  return (
    <S.StyledTask>
      <S.Header>
        <Checkbox
          onChecked={(checked) => onChecked(checked, task._id)}
          checked={task.checked || false}
        />
        <S.TaskTitle>{task.name}</S.TaskTitle>
        <S.Buttons>
          <IconButton
            icon={FaPen}
            size="24"
            color="black"
            onClick={() => onEdit(task._id)}
          />
          <IconButton
            icon={FaTrash}
            size="24"
            color="black"
            onClick={() => onDelete(task._id)}
          />
        </S.Buttons>
      </S.Header>
      <S.Footer>
        <S.TaskDescription description={task.description || ""}>
          {task.description || "No description"}
        </S.TaskDescription>
      </S.Footer>
    </S.StyledTask>
  );
};

export default TaskCard;
