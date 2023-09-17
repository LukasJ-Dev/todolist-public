import React, { InputHTMLAttributes } from "react";
import * as S from "./style";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  error,
  type = "text",
  ...rest
}) => {
  return (
    <S.InputLayout>
      {label ? (
        <S.LabelStyle htmlFor={id} isError={!!error}>
          {label}
        </S.LabelStyle>
      ) : (
        ""
      )}
      <S.InputStyle isError={!!error} type={type} {...rest} />
      {error ? <S.ErrorMessage>{error}</S.ErrorMessage> : ""}
    </S.InputLayout>
  );
};

export default Input;
