import { useEffect, useRef, useState } from "react";
import * as S from "./style";
import Input from "../UI/Input";
import Button from "../UI/Button";
import { theme } from "../../styles/themes";
import { TaskType } from "../../types";

interface Props {
  task: TaskType | null;
  onSave: (task: TaskType) => void;
  onCancel: () => void;
}

const EditTaskModal: React.FC<Props> = ({ task = null, onSave, onCancel }) => {
  const isOpen = task !== null;
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");

  useEffect(() => {
    setTitleInput(task?.name || "");
    setDescriptionInput(task?.description || "");

    if (isOpen && !dialogRef.current?.open) dialogRef.current?.showModal();
    else if (!isOpen && dialogRef.current?.open) dialogRef.current.close();
  }, [isOpen, task]);

  const handleSave = () => {
    if (task === null) return alert("No task to save");
    const editedTask = { ...task };
    editedTask.name = titleInput;
    editedTask.description = descriptionInput;
    onSave(editedTask);
  };

  const handleCancel = () => {
    onCancel();
  };
  return (
    <S.EditDialog ref={dialogRef}>
      <S.DialogContainer>
        <S.Text>Edit Task</S.Text>
        <Input
          label="Title"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
        />
        <Input
          label="Description"
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
        />
        <S.ModalButtonContainer>
          <Button onClick={handleSave}>Confirm</Button>
          <Button color={theme.colors.dark} onClick={handleCancel}>
            Cancel
          </Button>
        </S.ModalButtonContainer>
      </S.DialogContainer>
    </S.EditDialog>
  );
};

export default EditTaskModal;
