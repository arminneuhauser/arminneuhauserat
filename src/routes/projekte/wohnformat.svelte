<script lang="ts">
    import Hero from '$lib/projects/Hero.svelte';
    import Figure from '$lib/projects/Figure.svelte';
    import Facts from '$lib/projects/Facts.svelte';
    import LinkExternal from '$lib/projects/LinkExternal.svelte';
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
        <Facts
            href="https://www.wohnformat.at/">
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
        </Facts>
    </div>
</section>


<section class="col2 align-end">
    <div>
        <Figure src="/images/wohnformat/wohnformat1.jpg" alt="Wohnformat Startseite" width="1400" height="787" />
        <Figure src="/images/wohnformat/wohnformat4.jpg" alt="Wohnformat Tablets" width="1400" height="788" />
    </div>
</section>

<section class="col2">
    <div>
        <Figure src="/images/wohnformat/wohnformat2.jpg" alt="Wohnformat Kontakt" width="1400" height="1050" />
        <Figure src="/images/wohnformat/wohnformat5.jpg" alt="Wohnformat Phones" width="1400" height="1050" />
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

<section class="last">
    <div>
        <LinkExternal href="https://www.wohnformat.at/"></LinkExternal>
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
