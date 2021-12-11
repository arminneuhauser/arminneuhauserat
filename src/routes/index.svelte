<script context="module" lang="ts">
    export const prerender = true;
</script>

<script lang="ts">
    import Scene from '$lib/scene/Scene.svelte';
    import Hero from '$lib/hero/Hero.svelte';
    import LatestWork from '$lib/latest-work/LatestWork.svelte';
    import Wisdom from '$lib/wisdom/Wisdom.svelte';

    let scrollY;
</script>

<svelte:head>
    <title>Armin Neuhauser | Konzept, Design & Entwicklung</title>
</svelte:head>

<svelte:window bind:scrollY={scrollY}/>

<Hero scrollY={scrollY} />

<LatestWork scrollY={scrollY} />

<Wisdom />

<Scene />
