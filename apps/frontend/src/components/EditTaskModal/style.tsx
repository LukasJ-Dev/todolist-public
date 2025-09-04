import styled from "styled-components";
import { theme } from "../../styles/themes";

export const EditDialog = styled.dialog`
  margin: auto;
  padding: 10px;
  border: none;
  width: 400px;
  height: 250px;
  background-color: #f1f1f1f1;
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.boxShadow.medium};
  gap: 5px;
`;

export const DialogContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  gap: 10px;
`;

export const Text = styled.h2`
  font-family: Arial, Helvetica, sans-serif;
`;

export const ModalButtonContainer = styled.div`
  /* Styles for modal button container */
  display: flex;
  justify-content: flex-end;
  gap: 20px;
`;

export const ModalButton = styled.button`
  /* Styles for modal buttons */
  margin-left: 10px;
`;
