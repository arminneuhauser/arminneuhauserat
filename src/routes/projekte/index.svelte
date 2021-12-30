<script lang="ts">
    import Teaser from "$lib/projects/Teaser.svelte";
</script>

<svelte:head>
    <title>Armin Neuhauser | Projekte</title>
</svelte:head>

<section>
    <header>
        <div>
            <h1>Projekte,<br>auf die ich stolz bin</h1>
            <div>
                <p>Jedes Projekt ist eine Chance, etwas Neues zu probieren. Ich stelle Fragen, berate meine Kunden um gemeinsam das bestmögliche Ergebnis zu erreichen.</p>
            </div>
        </div>
    </header>
    <div class="projects">
        <div>
            <Teaser 
                slug="mst-muhr"
                title="MST Muhr"
                year="2022"
                desc="Webdesign, Development, CMS, Fotografie"
                image="/images/mst-muhr/mst-muhr.jpg"
            >
            </Teaser>

            <Teaser 
                slug="solmates"
                title="Solmates"
                year="2019"
                desc="Design, Development, CMS, Fotografie, Texte"
                image="/images/solmates/solmates.jpg"
            >
            </Teaser>

            <Teaser 
                slug="wohnformat"
                title="[wohnformat]"
                year="2016"
                desc="CI, Webdesign, Development, CMS"
                image="/images/wohnformat/wohnformat.jpg"
            >
            </Teaser>
        </div>
    </div>
</section>

<style lang="scss">
    @use "src/scss/animations.scss";

    header {
        box-sizing: border-box;
        padding: #{fn.rem(150)} var(--core-padding) #{fn.rem(100)};
        min-height: 100vh;
        display: flex;

        @media (prefers-reduced-motion: no-preference) {
            opacity: 0;
            animation: fadein-from-primary 0.5s var(--easing) forwards;
        }

        > div {
            flex-basis: 100%;
            display: grid;
            grid-gap: #{fn.rem(40)};
            grid-template-rows: auto min-content min-content auto;
            margin: 0 auto;
            max-width: var(--core-max-width);

            @media (min-width: var.$breakpoint-md) {
                grid-template-columns: repeat(12, 1fr);
                grid-row-gap: #{fn.rem(80)};
            }

            h1 {
                grid-row: 2;
                font-family: var(--serif);
                font-weight: 700;
                font-size: #{fn.rfs(45, 120)};
                line-height: 1;
                margin: 0;

                @media (min-width: var.$breakpoint-md) {
                    grid-column: 4 / span 9;
                }
            }

            div {
                grid-row: 3;
                border-bottom: 1px solid var(--on-base);
                font-size: #{fn.rfs(13, 16, $minWidth: 1280, $maxWidth: 2560)};
                padding-bottom: 2em;

                @media (min-width: var.$breakpoint-md) {
                    grid-column: 7 / span 6;
                }

                @media (min-width: var.$breakpoint-lg) {
                    grid-column: 9 / span 4;
                }

                p {
                    margin: 0;
                    max-width: #{fn.rem(300)};
                }
            }
        }
    }

    .projects {
        background-color: var(--base);
        box-sizing: border-box;
        padding: var(--core-padding);

        > div {
            display: grid;
            grid-gap: #{fn.rem(40)};
            margin: 0 auto;
            max-width: var(--core-max-width);

            @media (min-width: var.$breakpoint-md) {
                grid-template-columns: repeat(2, 1fr);
            }

            @media (min-width: var.$breakpoint-lg) {
                grid-template-columns: repeat(3, 1fr);
            }
        }
    }
</style>
