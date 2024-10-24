import { alpha, PaletteMode } from "@mui/material";
import { cyan, grey, lightGreen } from "@mui/material/colors";
import {
  createTheme,
  darken,
  lighten,
  getContrastRatio,
} from "@mui/material/styles";
import { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeProvider";

/**
 * Custom hook to access the theme context
 * @returns the theme context
 * @throws an error if the hook is not used within a ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

/**
 * Custom hook to generate and return the Material-UI theme based on the current mode
 * @returns the Material-UI theme
 * @throws an error if the hook is not used within a ThemeProvider
 */

export const useMUITheme = () => {
  const { theme } = useTheme();

  const primaryColor = lightGreen[700];
  const secondaryColor = cyan[500];
  const primary =
    theme === "light" ? lighten(primaryColor, 0.2) : darken(primaryColor, 0.2);
  const secondary =
    theme === "light"
      ? lighten(secondaryColor, 0.2)
      : darken(secondaryColor, 0.2);

  // Create a Material-UI theme based on the current mode
  const muiTheme = createTheme({
    palette: {
      mode: theme as PaletteMode,
      primary: {
        main: primary,
      },
      secondary: {
        main: secondary,
      },
    },
  });

  const scrollbarBackground = theme === "dark" ? "#333" : "#f1f1f1";
  const scrollbarThumbBackground = theme === "dark" ? "#888" : "#ccc";
  const scrollbarThumbHoverBackground = theme === "dark" ? "#555" : "#999";
  const scrollbarColor = `${scrollbarThumbBackground} ${scrollbarBackground}`;

  muiTheme.components = {
    MuiCssBaseline: {
      styleOverrides: `
      ::-webkit-scrollbar {
        width: 10px;
        border-radius: 5px;
      }
      ::-webkit-scrollbar-track {
        background: ${scrollbarBackground};
      }
      ::-webkit-scrollbar-thumb {
        background: ${scrollbarThumbBackground};
        border-radius: 5px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${scrollbarThumbHoverBackground};
      }
      @supports not selector(::-webkit-scrollbar) {
        html {
          scrollbar-color: ${scrollbarColor};
        }
      }
    `,
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: muiTheme.palette.background.default,
          color: theme === "light" ? "#000000" : "#ffffff",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          // Target the 'contained' variant
          color: "white",
          backgroundColor: primary,
          "&:hover": {
            color: "white",
            backgroundColor: secondary,
          },
        },
        outlined: {
          // Target the 'outlined' variant
          color: primary,
          borderColor: primary,
          "&:hover": {
            color: secondary,
            borderColor: secondary,
            backgroundColor: "transparent",
          },
        },
        text: {
          // Target the 'text' variant
          color: primary,
          "&:hover": {
            color: secondary,
            backgroundColor: "transparent",
            //underline in cyan
            textDecoration: "underline",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          "&.Mui-focused": {
            color: darken(grey[200], 0.4),
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: grey[200],
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: darken(grey[200], 0.2),
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: darken(grey[200], 0.4),
            color: "black",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor:
              muiTheme.palette.mode === "light"
                ? lighten(grey[200], 0.2)
                : darken(grey[800], 0.2),
          },
        },
        head: {
          backgroundColor: muiTheme.palette.background.default,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          borderRight: `1px solid ${muiTheme.palette.divider}`,
          borderColor: "divider",
          // Remove the border for the last cell
          "&:last-child": {
            borderRight: 0,
          },
          "&:first-of-type": {
            borderRight: 0,
          },
          textAlign: "left",
        },
        body: {
          textAlign: "left",
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          "&.Mui-checked": {
            color: primary,
          },
          "&.MuiCheckbox-indeterminate": {
            color: secondary,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: secondary,
            "&:hover": {
              backgroundColor: alpha(secondary, 0.2),
            },
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: secondary,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor:
              muiTheme.palette.mode === "light"
                ? lighten(grey[200], 0.2)
                : darken(grey[800], 0.2),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: primary,
          color: getContrastRatio(primary, "#fff") > 4.5 ? "#fff" : "#111",
          "&:hover": {
            backgroundColor: secondary,
            color: getContrastRatio(secondary, "#fff") > 1 ? "#fff" : "#111",
          },
        },
      },
    },
  };

  return muiTheme;
};
