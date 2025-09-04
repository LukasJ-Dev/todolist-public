import { StyledButton } from "./style";
import { theme } from "../../../styles/themes";

interface ButtonProps {
  color?: string;
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  children: string | JSX.Element | JSX.Element[];
  type?: "submit" | "button" | "reset";
}

const Button: React.FC<ButtonProps> = ({
  size = "small",
  color = theme.colors.primary,
  onClick,
  children,
  type = "button",
}) => {
  return (
    <StyledButton color={color} size={size} onClick={onClick} type={type}>
      {children}
    </StyledButton>
  );
};

export default Button;
