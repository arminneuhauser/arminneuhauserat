<script lang="ts">
    import Header from '$lib/header/Header.svelte';
    import { onMount } from 'svelte';
    import '../scss/app.scss';

    onMount(() => {
        const appHeight = () => {
            const doc = document.documentElement
            doc.style.setProperty('--app-height', `${window.innerHeight}px`)
        }
        window.addEventListener('resize', appHeight)
        appHeight()
    });
</script>

<Header />

<main>
    <slot />
</main>
