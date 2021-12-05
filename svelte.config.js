import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://github.com/sveltejs/svelte-preprocess
    // for more information about preprocessors
    preprocess: preprocess({
        sourceMap: true,
        scss: {
            prependData: '@use "src/scss/variables.scss" as var; @use "src/scss/functions.scss" as fn;',
        },
    }),

    kit: {
        adapter: adapter(),
        target: '#svelte',
        vite: {
            optimizeDeps: {
                include: ['url', 'querystring']
            },
        }  
    },
};

export default config;
