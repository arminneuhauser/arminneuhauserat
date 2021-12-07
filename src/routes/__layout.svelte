<script lang="ts">
    import { scheme } from '../stores.js';
    import Header from '$lib/header/Header.svelte';
    import { onMount, afterUpdate, beforeUpdate } from 'svelte';
    import '../scss/app.scss';

    let scheme_value;

	scheme.subscribe(value => {
		scheme_value = value;
	});

    onMount(() => {
        // set initial height of app to prevent webkit 100vh magic
        // recalculate when width changes however
        let width = window.innerWidth;

        const setAppHeight = () => {
            const doc = document.documentElement
            doc.style.setProperty('--app-height', `${window.innerHeight}px`)
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth != width) {
                width = window.innerWidth;
                setAppHeight();
            }
        });

        setAppHeight();
    });

    $: afterUpdate(() => {
        document.documentElement.setAttribute("color-scheme", scheme_value);
    });
</script>

<Header />

<main>
    <slot />
</main>
