import styled from "styled-components";
import { theme } from "../../../styles/themes";
import { colors } from "../../../styles/colors";

interface Props {
  isError?: boolean;
}

export const InputLayout = styled.div<Props>`
  color: ${(props) => (props.isError ? theme.colors.error : "black")};
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const InputStyle = styled.input<Props>`
  width: 100%;
  height: 30px;
  font-size: 0.9em;
  padding: 7px;
  border: ${(props) =>
    props.isError
      ? `2px solid ${theme.colors.error}`
      : `1px solid ${colors.grey[300]}`};
  background-color: white;
  border-radius: ${theme.borderRadius.small};
  &:focus {
    box-shadow: ${theme.boxShadow.small};

    border: 1px solid ${colors.grey[300]};
    outline: none;
  }
`;

export const LabelStyle = styled.label<Props>`
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-size: 1.12em;
`;

export const ErrorMessage = styled.p`
  color: ${theme.colors.error};
  font-weight: 500;
`;
