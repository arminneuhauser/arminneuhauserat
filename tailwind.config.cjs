const colors = require('tailwindcss/colors')

module.exports = {
    purge: ['./src/**/*.svelte', './src/**/*.css'],
    darkMode: false,
    theme: {
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
