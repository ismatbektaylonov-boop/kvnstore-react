import { createTheme } from "@mui/material";

// A custom theme for this app
const theme = createTheme({
    palette: {
        mode: 'light',
        background: { default: '#FFFFFF', paper: '#F5F5F7' },
        text: { primary: '#1D1D1F', secondary: '#1D1D1F', disabled: '#86868B' },
        divider: 'rgba(29, 29, 31, 0.12)',
        primary: {
             main: '#0071E3', light: '#0071E3', dark: '#0071E3', contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#0071E3', light: '#0071E3', dark: '#0071E3', contrastText: '#FFFFFF',
        },
        error: {
            main: '#1D1D1F',
        },
        success: { main: '#1D1D1F' },
        warning: { main: '#1D1D1F' },
        info: { main: '#0071E3' },
    },
});

export default theme;
