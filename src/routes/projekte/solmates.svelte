<script lang="ts">
    import Hero from '$lib/projects/Hero.svelte';
    import external from '$lib/projects/external.svg?raw';
</script>

<svelte:head>
    <title>Armin Neuhauser | Solmates</title>
    <meta name="description" content="Solmates ist ein Reiseblog von Armin & Miriam" />
</svelte:head>

<Hero 
    title="Solmates"
    desc="ein Blog für unsere Reise durch Lateinamerika"
    imageSm="/images/solmates/solmates-hero-sm.jpg"
    >
</Hero>

<section>
    <div>
        <div class="facts">
            <div>
                <h3>Launch</h3>
                <p>November 2019</p>
            </div>
            <div>
                <h3>Services</h3>
                <p>Konzept, Webdesign, UI/UX, Development, Content Management System, Fotografie, Texte, Buchgestaltung</p>
            </div>
            <div>
                <a href="https://www.solmates.at/" target="_blank">
                    <span>Website ansehen</span>
                    {@html external}
                </a>
            </div>
        </div>
    </div>
</section>

<section class="full">
    <div>
        <img src="/images/solmates/solmates01.jpg" alt="Solmates Homepage">
    </div>
</section>

<section>
    <div>
        <p>
            Solmates ist ein Reiseblog von Armin & Miriam. Dieser Blog ist ein Platz um Erinnerungen zu speichern und zu teilen – für uns selbst, unsere Familie und Freunde. Wir hoffen aber, dass unsere Beiträge auch für alle, die eine ähnliche Reise geplant haben, hilfreich sind und freuen uns, wenn wir den ein oder anderen dazu inspirieren. Mehr über das Design und die Entwicklung des Blog könnt ihr hier lesen.
        </p>
    </div>
</section>

<section>
    <div>
        <img src="/images/solmates/solmates02.jpg" alt="Solmates Kategorie">
        <img src="/images/solmates/solmates03.jpg" alt="Solmates Blog">
        <img src="/images/solmates/solmates04.jpg" alt="Solmates Reisekarte">
    </div>
</section>

<section class="next">
    <h3>Nächstes Projekt</h3>
    <a href="/projekte/mst-muhr" class="circle">
        <div class="text">
            <h1>MST Muhr</h1>
            <hr>
            <p>individuelle Unternehmenswebsite</p>
        </div>
    </a>
</section>

<style lang="scss">
    @use "../../scss/detail.scss";
    .next .circle {
        background-image: url('/images/mst-muhr/mst-muhr.jpg');
    }
</style>
