import styled from "styled-components";

export const IconButtonStyle = styled.button<{ size: string }>`
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border: none;
  cursor: pointer;
`;

export const ImgStyle = styled.img`
  filter: invert(1);
  ${({ color }) => `fill: ${color};`}
`;
