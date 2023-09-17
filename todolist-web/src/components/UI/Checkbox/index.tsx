import * as S from "./style";

interface Props {
  onChecked: (checked: boolean) => void;
  checked: boolean;
}

const Checkbox: React.FC<Props> = ({ onChecked, checked }) => {
  const handleCheckboxChange = (event: React.FormEvent<HTMLInputElement>) => {
    onChecked(event.currentTarget.checked);
  };

  return (
    <S.CheckboxDiv>
      <S.CheckboxLabel checked={checked}>
        <S.CheckboxStyle checked={checked} onChange={handleCheckboxChange} />
      </S.CheckboxLabel>
    </S.CheckboxDiv>
  );
};

export default Checkbox;
