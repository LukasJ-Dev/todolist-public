import styled from "styled-components";
import { theme } from "../../styles/themes";

export const StyledTask = styled.ul`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: ${theme.borderRadius.medium};
`;

export const Header = styled.div`
  display: flex;
  height: 60px;
  gap: 10px;
  align-items: center;
`;

export const Footer = styled.div`
  margin: 3px 10px;
  font-family: Arial, Helvetica, sans-serif;
`;

export const Buttons = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-around;
`;

export const TaskTitle = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1.25em;
  padding: 10px;
  width: 100%;
`;

export const NewTask = styled.input`
  border: none;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1.25em;
  padding: 10px;
  width: 100%;
`;

export const TaskDescription = styled.p<{ description: string }>`
  ${(props) => !props.description && "color: #9c9c9c; font-style: italic;"}
`;
