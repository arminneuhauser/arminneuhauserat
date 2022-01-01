<script lang="ts">
    import Hero from '$lib/projects/Hero.svelte';
    import external from '$lib/projects/external.svg?raw';
</script>

<svelte:head>
    <title>Armin Neuhauser | MST Muhr</title>
    <meta name="description" content="MST Muhr" />
</svelte:head>

<Hero 
    title="MST Muhr"
    desc="individuelle Unternehmenswebsite"
    imageSm="/images/mst-muhr/mst-hero-sm.jpg"
    imageLg="/images/mst-muhr/mst-hero-lg.jpg"
    >
</Hero>

<section class="next">
    <h3>Nächstes Projekt</h3>
    <a href="/projekte/solmates" class="circle">
        <div class="text">
            <h1>Solmates</h1>
            <hr>
            <p>ein Blog für unsere Reise durch Lateinamerika</p>
        </div>
    </a>
</section>

<style lang="scss">
    @use "../../scss/detail.scss";
    .next .circle {
        background-image: url('/images/solmates/solmates-hero-sm.jpg');
    }
</style>