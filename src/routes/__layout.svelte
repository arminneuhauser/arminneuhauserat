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
        const appHeight = () => {
            const doc = document.documentElement
            doc.style.setProperty('--app-height', `${window.innerHeight}px`)
        }
        window.addEventListener('resize', appHeight)
        appHeight();
    });

    $: afterUpdate(() => {
        document.documentElement.setAttribute("color-scheme", scheme_value);
    });
</script>

<Header />

<main>
    <slot />
</main>
