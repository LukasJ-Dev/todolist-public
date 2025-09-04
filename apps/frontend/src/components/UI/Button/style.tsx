import styled from "styled-components";
import { theme } from "../../../styles/themes";

interface Props {
  size: string;
}

export const StyledButton = styled.button<Props>`
  background-color: ${(props) => props.color};
  color: white;
  padding: 10px 20px;
  border: none;
  box-shadow: ${theme.boxShadow.medium};
  font-size: 1em;
  border-radius: ${theme.borderRadius.small};
  width: 100%;
  &:hover {
    opacity: 0.75;
  }
  &:active {
    opacity: 0.65;
    box-shadow: ${theme.boxShadow.small};
  }
  &:disabled {
    opacity: 0.9;
  }
`;
