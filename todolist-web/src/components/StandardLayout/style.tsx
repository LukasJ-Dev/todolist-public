import styled from "styled-components";
import { colors } from "../../styles/colors";

export const LayoutStyle = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100vw;
  height: 100vh;
  background-color: ${colors.grey["100"]};
`;
