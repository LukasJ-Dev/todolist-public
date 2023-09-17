import styled from "styled-components";

export const styledTodolist = styled.ul`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const TodolistHead = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  margin-top: 10px;
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  flex-wrap: wrap;
`;

export const styledTitle = styled.p`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 2em;
`;
