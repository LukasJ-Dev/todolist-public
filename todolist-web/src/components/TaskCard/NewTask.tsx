import * as S from "./style";

interface Props {
  callback: (value: string) => void;
}

const NewTaskCard: React.FC<Props> = ({ callback }) => {
  const onEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key == "Enter") {
      callback(event.currentTarget.value);
    }
  };

  return (
    <S.StyledTask>
      <S.NewTask placeholder="New Task" onKeyDown={onEnter} />
    </S.StyledTask>
  );
};

export default NewTaskCard;
