import React from "react";
import * as S from "./style";
import { IconContext, IconType } from "react-icons";

interface Props {
  size: string;
  icon: IconType;
  color: string;
  onClick: () => void;
}

const IconButton: React.FC<Props> = ({
  size = "32",
  icon,
  color = "black",
  onClick,
}) => {
  const Icon = icon;
  return (
    <S.IconButtonStyle size="32" onClick={onClick}>
      <IconContext.Provider value={{ color, size }}>
        <Icon />
      </IconContext.Provider>
    </S.IconButtonStyle>
  );
};

export default IconButton;
