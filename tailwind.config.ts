import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'
import colors from 'tailwindcss/colors'

export default {
    content: ['./index.html', './src/**/*.tsx'],
    darkMode: 'class',
    theme: {
        colors: {
            white: '#ffffff',
            orange: '#ff7e73',
            brown: '#776464',
            milky: '#efebe5',
            blue: '#0a88ca',
            lightblue: '#d6ecf7',
            attention: '#ffd2d4',
            attentiondark: '#ffedef',
            black: '#000000',
            gray: colors.gray,
            dark: {
                '50': '#f2f2f2',
                '100': '#eaeaea',
                '200': '#ffa39b',
                '300': '#94a3b8',
                '400': '#8b807f',
                '500': '#776464',
                '600': '#483637',
                '700': '#464343',
                '800': '#333131',
                '900': '#2d2a2a',
                '950': '#221f1f',
            },
        },
        fontFamily: {
            body: ['Poppins', ...fontFamily.sans],
            logo: ['Eczar', ...fontFamily.serif],
        },
        extend: {},
    },
    plugins: [],
} satisfies Config
