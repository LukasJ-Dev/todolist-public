import styled from "styled-components";
import { colors } from "../../../styles/colors";

export const StyledSidebar = styled.aside`
  height: 100%;
  background-color: ${colors.grey["300"]};
  min-width: 200px;
  font-family: Arial, Helvetica, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 5px;

  padding-top: 10px;
`;

export const SidebarTitle = styled.p`
  font-size: 1.5em;
  font-weight: 600;
`;

export const ItemList = styled.ul`
  list-style: none;
`;

export const StyledItem = styled.li<{ isSelected: boolean }>`
  background-color: ${(props) => (props.isSelected ? colors.grey["400"] : "")};
  height: 30px;
  display: flex;
  align-items: center;
  padding: 5px;
  cursor: pointer;
`;

export const InputItem = styled.input.attrs({ type: "text" })`
  border: none;
  background-color: transparent;

  appearance: none;
  height: 100%;
`;
