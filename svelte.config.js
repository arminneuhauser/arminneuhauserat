import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://github.com/sveltejs/svelte-preprocess
    // for more information about preprocessors
    preprocess: preprocess({
        sourceMap: true,
        scss: {
            prependData: '@use "src/scss/functions.scss" as fn;',
        },
    }),

    kit: {
        // hydrate the <div id="svelte"> element in src/app.html
        target: '#svelte',
        vite: {
            optimizeDeps: {
                include: ['url', 'querystring']
            }
        }  
    },
};

export default config;
