import { colors } from "./colors";

export const theme = {
  colors: {
    primary: colors.lightblue["800"],
    secondary: "",
    success: colors.green["a700"],
    error: colors.red["800"],
    warning: colors.yellow["800"],
    light: colors.grey["100"],
    dark: colors.grey["900"],
  },

  boxShadow: {
    small: "0 3px 3px rgba(0, 0, 0, 0.3)",
    medium: "0 4px 4px rgba(0, 0, 0, 0.3)",
    large: "0 10px 10px rgba(0, 0, 0, 0.3)",
  },

  borderRadius: {
    small: "6px",
    medium: "10px",
    large: "15px",
  },
};
