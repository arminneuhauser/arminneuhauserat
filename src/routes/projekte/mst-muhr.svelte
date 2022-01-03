<script lang="ts">
    import Hero from '$lib/projects/Hero.svelte';
    import Parallax from '$lib/projects/Parallax.svelte';
    import Switch from '$lib/projects/Switch.svelte';
    import external from '$lib/projects/external.svg?raw';

    let dark = false;
</script>

<svelte:head>
    <title>MST Muhr | Armin Neuhauser</title>
    <meta name="description" content="MST Muhr" />
</svelte:head>

<Hero 
    title="MST Muhr"
    desc="individuelle Unternehmenswebsite"
    imageSm="/images/mst-muhr/mst-hero-sm.jpg"
    imageLg="/images/mst-muhr/mst-hero-lg.jpg"
    >
</Hero>

<section>
    <div>
        <div class="facts">
            <div>
                <h3>Launch</h3>
                <p>Jänner 2022</p>
            </div>
            <div>
                <h3>Services</h3>
                <p>Konzept & Beratung, Webdesign, UI/UX, Development, Content Management System, Fotografie</p>
            </div>
            <div>
                <h3>Technologien</h3>
                <p>Vue.js, Nuxt.js, Storyblok, Netlify</p>
            </div>
            <div>
                <a class="link" href="https://www.mst-muhr.at/" target="_blank">
                    <span>Website ansehen</span>
                    <i>{@html external}</i>
                </a>
            </div>
        </div>
    </div>
</section>

<Parallax
    image="/images/mst-muhr/mst-schweizergarten.jpg"
    width="1920"
    height="1280"
    alt="MST Muhr Schweizergarten"
    >
</Parallax>

<section class="narrow">
    <div>
        <div>
            <hr>
            <h1>
                Eine großartige Website für ein großartiges Unternehmen
            </h1>
            <p>
                Die MST Muhr Sanierungstechnik wurde 1995 aus dem Interesse Bauwerke zu erhalten und einer Begeisterung für individuelle Lösungen in der Sanierung von Hoch- und Tiefbauobjekten gegründet.
            </p>
            <p>
                2021 begann die Zusammenarbeit zwischen mir und der MST mit der Zielsetzung eine individuelle, editierbare und nicht zuletzt einzigartige Website zu kreieren, die die Spitzenposition des Unternehmens in der Branche widerspiegelt.
            </p>
        </div>
    </div>
</section>

<section class="narrow">
    <div>
        <Switch 
            bind:checked={dark}
            label1="Light mode"
            label2="Dark mode"
            >
        </Switch>
    </div>
</section>

<section class="col2">
    <div>
        {#if dark}
            <img src="/images/mst-muhr/mst-muhr-01-dark.jpg" alt="MST Muhr Startseite" width="1920" height="1200">
            <img src="/images/mst-muhr/mst-muhr-02-dark.jpg" alt="MST Muhr Kontakt" width="1920" height="1200">
        {:else}
            <img src="/images/mst-muhr/mst-muhr-01.jpg" alt="MST Muhr Startseite" width="1920" height="1200">
            <img src="/images/mst-muhr/mst-muhr-02.jpg" alt="MST Muhr Kontakt" width="1920" height="1200">
        {/if}
    </div>
</section>

<section>
    <div>
        <a class="link" href="https://www.mst-muhr.at/" target="_blank">
            <span>Website ansehen</span>
            <i>{@html external}</i>
        </a>
    </div>
</section>

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