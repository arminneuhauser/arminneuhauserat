<script context="module" lang="ts">
    export const prerender = true;
</script>

<script lang="ts">
    import Counter from '$lib/Counter.svelte';
</script>

<svelte:head>
    <title>Home</title>
</svelte:head>

<section>
    <h1>
        Ich erschaffe digitale<br>
        Erlebnisse, jeden Tag.
    </h1>
</section>

<style>
    h1 {
        @apply font-serif;
    }
</style>