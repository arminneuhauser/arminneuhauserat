<script lang="ts">
    import Hero from '$lib/projects/Hero.svelte';
    import Parallax from '$lib/projects/Parallax.svelte';
    import Next from '$lib/projects/Next.svelte';

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
        <video width="1152" height="720" muted playsinline loop autoplay poster="/images/solmates/solmates01.jpg">
            <source src="/images/solmates/solmates.webm" type="video/webm">
            <source src="/images/solmates/solmates.mp4" type="video/mp4">
        </video>
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
    width="1920"
    height="1280"
    alt="Solamtes Cartagena Kolumbien"
    >
</Parallax>

<section class="narrow">
    <div>
        <img src="/images/solmates/solmates-home.jpg" alt="Solmates Startseite">
    </div>
</section>

<section class="col2 align-end">
    <div>
        <img src="/images/solmates/solmates-san-blas-02.jpg" alt="Solmates San Blas Inseln">
        <img src="/images/solmates/solmates-costa-rica.jpg" alt="Solmates Costa Rica">
        <img src="/images/solmates/solmates-boquete.jpg" alt="Solmates Vulkan Baru">
        <img src="/images/solmates/solmates-peru.jpg" alt="Solmates Peru">
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

<section class="full">
    <div>
        <video width="1152" height="720" muted playsinline loop autoplay poster="/images/solmates/solmates01.jpg">
            <source src="/images/solmates/solmates-buch.webm" type="video/webm">
            <source src="/images/solmates/solmates-buch.mp4" type="video/mp4">
        </video>
    </div>
</section>

<section class="col2">
    <div>
        <img src="/images/solmates/solmates-buch.jpg" alt="Solmates Buch">
        <img src="/images/solmates/solmates-buch-02.jpg" alt="Solmates Buch Rückseite">
    </div>
</section>

<section class="last">
    <div>
        <a class="link" href="https://www.solmates.at/" target="_blank">
            <span>Website ansehen</span>
            <i>{@html external}</i>
        </a>
    </div>
</section>

<Next
    title="MST Muhr"
    desc="individuelle Unternehmenswebsite"
    slug="/projekte/mst-muhr"
    image="/images/mst-muhr/mst-hero-sm.jpg"
    >
</Next>

<style lang="scss">
    @use "../../scss/detail.scss";
</style>
