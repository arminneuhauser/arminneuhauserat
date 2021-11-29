const colors = require('tailwindcss/colors')

module.exports = {
    purge: ['./src/**/*.svelte', './src/**/*.css'],
    darkMode: 'media',
    theme: {
        colors: {
            primary: 'var(--color-primary)',
            secondary: 'var(--color-secondary)',
            transparent: 'transparent',
            current: 'currentColor',
            black: colors.black,
            white: colors.white,
            gray: colors.gray,
        },
        fontFamily: {
            'sans': ['"TT Norms Pro"', 'ui-sans-serif', 'system-ui'],
            'serif': ['"Recoleta"', 'ui-serif', 'Georgia'],
        },
        borderColor: theme => ({
            DEFAULT: theme('colors.black', 'currentColor'),
        }),
    },
    plugins: [],
}
