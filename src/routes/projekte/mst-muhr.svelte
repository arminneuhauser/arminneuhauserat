<script lang="ts">
    import Hero from '$lib/projects/Hero.svelte';
    import Parallax from '$lib/projects/Parallax.svelte';
    import Figure from '$lib/projects/Figure.svelte';
    import Video from '$lib/projects/Video.svelte';
    import Facts from '$lib/projects/Facts.svelte';
    import LinkExternal from '$lib/projects/LinkExternal.svelte';
    import Switch from '$lib/projects/Switch.svelte';
    import Next from '$lib/projects/Next.svelte';

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
        <Facts
            href="https://www.mst-muhr.at/">
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
        </Facts>
    </div>
</section>

<Parallax
    image="/images/mst-muhr/mst-muhr-schweizergarten.jpg"
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
            <Figure src="/images/mst-muhr/mst-muhr-01-dark.jpg" alt="MST Muhr Startseite" width="1920" height="1200" />
            <Figure src="/images/mst-muhr/mst-muhr-02-dark.jpg" alt="MST Muhr Kontakt" width="1920" height="1200" />
        {:else}
            <Figure src="/images/mst-muhr/mst-muhr-01.jpg" alt="MST Muhr Startseite" width="1920" height="1200" />
            <Figure src="/images/mst-muhr/mst-muhr-02.jpg" alt="MST Muhr Kontakt" width="1920" height="1200" />
        {/if}
    </div>
</section>

<section class="full">
    <div>
        {#if dark}
            <Video 
                src="/images/mst-muhr/mst-muhr-dark.mp4"
                srcWebm="/images/mst-muhr/mst-muhr-dark.webm"
                width="1152" 
                height="720" 
                poster="/images/mst-muhr/mst-muhr-01-dark.jpg">
            </Video>
        {:else}
            <Video 
                src="/images/mst-muhr/mst-muhr.mp4"
                srcWebm="/images/mst-muhr/mst-muhr.webm"
                width="1152" 
                height="720" 
                poster="/images/mst-muhr/mst-muhr-01.jpg">
            </Video>
        {/if}
    </div>
</section>

<section>
    <div>
        {#if dark}
            <Figure src="/images/mst-muhr/mst-muhr-mobile-dark.jpg" alt="MST Muhr Mobile" width="1920" height="1248" />
        {:else}
            <Figure src="/images/mst-muhr/mst-muhr-mobile.jpg" alt="MST Muhr Mobile" width="1920" height="1248" />
        {/if}
    </div>
</section>

<section class="narrow">
    <div>
        <div>
            <hr>
            <h1>
                Fotografie
            </h1>
            <p>
                Zusätzlich zur Website durfte ich für die MST einige fertige Sanierungsprojekte, z.B. Garagen im Schweizergarten und in der Winmühlgasse, fotografieren. Diese Fotos kommen nicht nur auf der Website von der MST zum Einsatz, sondern auch bei Projektpartnern und Auftraggebern.
            </p>
        </div>
    </div>
</section>

<section class="col2">
    <div>
        <Figure src="/images/mst-muhr/mst-muhr-schweizergarten-02.jpg" alt="MST Muhr Schweizergarten Arsenalstraße" width="1920" height="1280" />
        <Figure src="/images/mst-muhr/mst-muhr-schweizergarten-03.jpg" alt="MST Muhr Schweizergarten" width="1920" height="1280" />
        <Figure src="/images/mst-muhr/mst-muhr-gugitzgasse.jpg" alt="MST Muhr Gugitzgasse" width="1920" height="1280" />
        <Figure src="/images/mst-muhr/mst-muhr-windmuehlgasse.jpg" alt="MST Muhr Windmühlgasse" width="1920" height="1280" />
    </div>
</section>

<section class="last">
    <div>
        <LinkExternal href="https://www.mst-muhr.at/"></LinkExternal>
    </div>
</section>

<Next
    title="Solmates"
    desc="ein Blog für unsere Reise durch Lateinamerika"
    slug="/projekte/solmates"
    image="/images/solmates/solmates-hero-sm.jpg"
    >
</Next>

<style lang="scss">
    @use "../../scss/detail.scss";
</style>