import preprocess from 'svelte-preprocess';
import netlify from '@sveltejs/adapter-netlify';

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
        // By default, `npm run build` will create a standard Node app.
        // You can create optimized builds for different platforms by
        // specifying a different adapter
        adapter: netlify(),
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
