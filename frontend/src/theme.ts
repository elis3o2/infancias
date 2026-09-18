import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#005cc6",
      dark: "#004a9f",
      light: "#b8d9ff",
    },
    success: {
      main: "#197a4b",
    },
    warning: {
      main: "#b76a00",
    },
    error: {
      main: "#bd2c36",
    },
    background: {
      default: "#f5f7fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#172033",
      secondary: "#5f6b7d",
    },
    action: {
      hover: "#f1f5f9",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      letterSpacing: "-0.02em",
    },
    h6: {
      letterSpacing: "-0.01em",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
        },
      },
    },
  },
});

export default theme;
