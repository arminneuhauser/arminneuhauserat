<script lang="ts">
    import Hero from '$lib/projects/Hero.svelte';
    import Parallax from '$lib/projects/Parallax.svelte';
    import external from '$lib/projects/external.svg?raw';
</script>

<svelte:head>
    <title>Solmates | Armin Neuhauser</title>
    <meta name="description" content="Solmates ist ein Reiseblog von Armin & Miriam" />
</svelte:head>

<Hero 
    title="Solmates"
    desc="ein Blog für unsere Reise durch Lateinamerika"
    imageSm="/images/solmates/solmates-hero-sm.jpg"
    imageLg="/images/solmates/solmates-hero-lg.jpg"
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
                <h3>Technologien</h3>
                <p>Vue.js, Nuxt.js, Storyblok, Netlify, Mailchimp</p>
            </div>
            <div>
                <a class="link" href="https://www.solmates.at/" target="_blank">
                    <span>Website ansehen</span>
                    <i>{@html external}</i>
                </a>
            </div>
        </div>
    </div>
</section>

<section class="full">
    <div>
        <video src="/images/solmates/solmates.mp4" muted playsinline loop autoplay poster="images/solmates/solmates01.jp"></video>
    </div>
</section>

<section class="narrow">
    <div>
        <div>
            <hr>
            <h1>
                Solmates ist ein Reiseblog von Armin & Miriam.
            </h1>
            <p>
                Zu reisen, um neue Orte zu entdecken, ist für mich eines der schönsten und aufregendsten Dinge im Leben. Deshalb bin ich gemeinsam mit meiner Partnerin im November 2019 aufgebrochen, um Lateinamerika zu bereisen. Mit dem Blog wollte ich einen Platz erschaffen, um Erinnerungen zu speichern und zu teilen – für uns selbst, unsere Familien und Freunde.
            </p>
            <p>
                Den Blog habe ich von Grund auf mit Vue & Nuxt gebaut. Die Texte und Bilder werden in dem Content Management System Storyblok gepflegt.
            </p>
        </div>
    </div>
</section>

<Parallax
    image="/images/solmates/solmates-cartagena.jpg"
    alt="Solamtes Cartagena Kolumbien"
    >
</Parallax>

<section class="col2 align-end">
    <div>
        <img src="/images/solmates/solmates02.jpg" alt="Solmates Kategorie">
        <img src="/images/solmates/solmates03.jpg" alt="Solmates Blog">
    </div>
</section>

<section class="col2">
    <div>
        <img src="/images/solmates/solmates04.jpg" alt="Solmates Reisekarte">
        <img src="/images/solmates/solmates05.jpg" alt="Solmates Über uns">
    </div>
</section>

<section class="narrow">
    <div>
        <div>
            <hr>
            <h1>
                Mit dem Rucksack durch Lateinamerika
            </h1>
            <p>
                Nach unserer Rückkehr nach Österreich ist im Sommer 2020 ein 328-seitiger Fotoband entstanden. Dieses Buch erzählt von der gesamten Reise „von den Alpen in die Anden“.
            </p>
        </div>
    </div>
</section>

<section class="col2">
    <div>
        <img src="/images/solmates/solmates-buch.jpg" alt="Solmates Buch">
        <img src="/images/solmates/solmates-buch-02.jpg" alt="Solmates Buch Rückseite">
    </div>
</section>

<section>
    <div>
        <a class="link" href="https://www.solmates.at/" target="_blank">
            <span>Website ansehen</span>
            <i>{@html external}</i>
        </a>
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
        background-image: url('/images/mst-muhr/mst-hero-sm.jpg');
    }
</style>
