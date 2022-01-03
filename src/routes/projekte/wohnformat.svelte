<script lang="ts">
    import Hero from '$lib/projects/Hero.svelte';
    import Parallax from '$lib/projects/Parallax.svelte';
    import Switch from '$lib/projects/Switch.svelte';
    import Next from '$lib/projects/Next.svelte';

    import external from '$lib/projects/external.svg?raw';

    let dark = false;
</script>

<svelte:head>
    <title>Wohnformat | Armin Neuhauser</title>
    <meta name="description" content="Wohnformat" />
</svelte:head>

<Hero 
    title="Wohnformat"
    desc="die Möbel- und Designwerkstatt"
    imageSm="/images/wohnformat/wohnformat-hero-sm.jpg"
    imageLg="/images/wohnformat/wohnformat-hero-lg.jpg"
    >
</Hero>

<section>
    <div>
        <div class="facts">
            <div>
                <h3>Launch</h3>
                <p>Oktober 2016</p>
            </div>
            <div>
                <h3>Services</h3>
                <p>Corporate Identity, Webdesign, UI/UX, Development, Content Management System</p>
            </div>
            <div>
                <h3>Technologien</h3>
                <p>WordPress</p>
            </div>
            <div>
                <a class="link" href="https://www.wohnformat.at/" target="_blank">
                    <span>Website ansehen</span>
                    <i>{@html external}</i>
                </a>
            </div>
        </div>
    </div>
</section>


<section class="col2 align-end">
    <div>
        <img src="/images/wohnformat/wohnformat1.jpg" alt="Wohnformat Startseite">
        <img src="/images/wohnformat/wohnformat4.jpg" alt="Wohnformat Tablets">
    </div>
</section>

<section class="col2">
    <div>
        <img src="/images/wohnformat/wohnformat2.jpg" alt="Wohnformat Kontakt">
        <img src="/images/wohnformat/wohnformat5.jpg" alt="Wohnformat Phones">
    </div>
</section>

<section class="narrow">
    <div>
        <div>
            <hr>
            <h1>
                Wohnträume nach Maß
            </h1>
            <p>
                Wohnformat ist das Unternehmen von Patrick Schachinger und Johannes Haberfehlner. Gemeinsam mit ihren Kunden planen sie Räume und Möbel nach Maß. Ich durfte das Corporate Design und die Website von Wohnformat konzipieren und umsetzen. Dabei war ich von der Firmengründung an involviert und konnte so die Marke von Grund auf definieren.
            </p>
            <p>
                Bei der Website von Wohnformat habe ich auf ein klassisches, modernes und minimalistisches Design gesetzt. Programmiert wurde die Website mit modernen „state of the art“ Technologien im Responsive Design. Im Hintergrund läuft das bekannte CMS WordPress. Wohnformat kann damit selbst Blog-Beiträge, Projekte und Seiten anlegen und bearbeiten.
            </p>
        </div>
    </div>
</section>

<section>
    <div>
        <a class="link" href="https://www.wohnformat.at/" target="_blank">
            <span>Website ansehen</span>
            <i>{@html external}</i>
        </a>
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
