import styled from "styled-components";

export const CheckboxDiv = styled.div`
  position: relative;
  width: 35px;
  height: 35px;
`;

export const CheckboxStyle = styled.input.attrs({ type: "checkbox" })`
  width: 35px;
  height: 35px;
  visibility: hidden;
`;

export const CheckboxLabel = styled.label<{ checked: boolean }>`
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 50%;
  cursor: pointer;
  height: 35px;
  left: 0;
  position: absolute;
  top: 0;
  width: 35px;

  ${(props) =>
    props.checked
      ? `
  background-color: #66bb6a;
  border-color: #66bb6a;
  `
      : ""}

  &::after {
    border: 2px solid #fff;
    border-top: none;
    border-right: none;
    content: "";
    height: 7px;
    left: 9px;
    opacity: ${(props) => (props.checked ? "1" : "0")};
    position: absolute;
    top: 10px;
    transform: rotate(-45deg);
    width: 15px;
  }
`;
