import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'
import colors from 'tailwindcss/colors'

export default {
    content: ['./index.html', './src/**/*.tsx'],
    theme: {
        colors: {
            white: '#ffffff',
            orange: '#ff7e73',
            brown: '#776464',
            milky: '#efebe5',
            blue: '#0a88ca',
            lightblue: '#d6ecf7',
            black: '#000000',
            gray: colors.gray,
        },
        fontFamily: {
            body: ['Poppins', ...fontFamily.sans],
            logo: ['Eczar', ...fontFamily.serif],
        },
        extend: {},
    },
    plugins: [],
} satisfies Config
