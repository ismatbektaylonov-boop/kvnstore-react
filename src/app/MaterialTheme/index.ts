import { createTheme } from '@mui/material/styles';
import { common } from '@mui/material/colors';
import shadow from './shadow';
import typography from './typography';
import { maxWidth } from '@mui/system';

/**
 * LIGHT THEME (DEFAULT)
 */
const light = {
	palette: {
		mode: 'light' as const,
		background: {
			default: '#FFFFFF',
			paper: '#F5F5F7',
		},
		primary: {
			contrastText: '#FFFFFF',
			main: '#0071E3',
			light: '#0071E3',
			dark: '#0071E3',
		},
		secondary: {
			contrastText: '#FFFFFF',
			main: '#0071E3',
			light: '#0071E3',
			dark: '#0071E3',
		},
		text: {
			primary: '#1D1D1F',
			secondary: '#1D1D1F',
			disabled: '#86868B',
			dark: '#1D1D1F',
		},
		divider: 'rgba(29, 29, 31, 0.12)',
		error: { main: '#1D1D1F' },
		success: { main: '#1D1D1F' },
		warning: { main: '#1D1D1F' },
		info: { main: '#0071E3' },
	},
	components: {
		MuiContainer: {
			styleOverrides: {
				root: {
					height: '100%',
				},
			},
		},
		MuiCssBaseline: {
			styleOverrides: {
				html: { height: '100%' },
				body: { background: '#FFFFFF', height: '100%', minHeight: '100%' },
			},
		},
	},
	shadow,
	typography,
};

// A custom theme for this app
let theme = createTheme(light);
theme = createTheme(theme, {
	components: {
		MuiContainer: {
			styleOverrides: {
				maxWidthLg: {
					[theme.breakpoints.up('lg')]: {
						maxWidth: '1300px',
					},
				},
			},
		},
	},
});

export default theme;
