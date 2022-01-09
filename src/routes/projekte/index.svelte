<script lang="ts">
    import Teaser from "$lib/projects/Teaser.svelte";
</script>

<svelte:head>
    <title>Projekte| Armin Neuhauser</title>
</svelte:head>

<section>
    <header>
        <div>
            <h1>
                <span class="mask"><span>Projekte,</span></span>
                <span class="mask"><span>auf die ich stolz bin</span></span>
            </h1>
            <div>
                <p class="mask">
                    <span>Jedes Projekt ist eine Chance, etwas Neues auszuprobieren. Ich gehe auf die Wünsche meiner Kunden ein und berate sie, um gemeinsam das bestmögliche Ergebnis zu erreichen.</span>
                </p>
                <hr>
            </div>
        </div>
    </header>
    <div class="projects">
        <div class="projects-list">
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
                title="Wohnformat"
                year="2016"
                desc="CI, Webdesign, Development, CMS"
                image="/images/wohnformat/wohnformat.jpg"
            >
            </Teaser>
        </div>
        <div class="coming-soon">
            <p>Weitere Projekte kommen bald</p>
        </div>
    </div>
</section>

<style lang="scss">
    @use "src/scss/animations.scss";

    header {
        box-sizing: border-box;
        padding: #{fn.rem(150)} var(--core-padding) #{fn.rem(100)};
        min-height: 60vh;
        display: flex;

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
                align-items: end;
            }

            @media (min-width: var.$breakpoint-1xl) {
                grid-gap: #{fn.rem(80)};
            }

            .mask {
                span {
                    animation: to-top 1.2s var(--easing) forwards;
                }
                &:nth-child(2) span {
                    animation-delay: 200ms;
                }
            }

            h1 {
                grid-row: 2;
                font-family: var(--serif);
                font-weight: 700;
                font-size: #{fn.rem(45)};
                line-height: 1;
                margin: 0;

                @media (min-width: var.$breakpoint-md) {
                    grid-column: 1 / span 6;
                    grid-row: 3;
                    font-size: #{fn.rfs(56, 90, $minWidth: 768, $maxWidth: 2560)};
                }

                @media (min-width: var.$breakpoint-1xl) {
                    grid-column: 1 / span 6;
                }
            }

            div {
                grid-row: 3;
                font-size: #{fn.rfs(13, 16, $minWidth: 1280, $maxWidth: 2560)};

                @media (min-width: var.$breakpoint-md) {
                    grid-column: 7 / span 6;
                }

                @media (min-width: var.$breakpoint-1xl) {
                    grid-column: 9 / span 4;
                }

                p {
                    margin: 0;
                    max-width: #{fn.rem(300)};
                }

                hr {
                    margin: #{fn.rem(20)} 0 0;
                    transform: scaleX(0);
                    transform-origin: top left;
                    animation: scale 0.8s 0.3s var(--easing) forwards;
                }
            }
        }
    }

    .projects {
        background-color: var(--base);
        box-sizing: border-box;
        padding: var(--core-padding);
    }

    .projects-list {
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

        @media (min-width: var.$breakpoint-1xl) {
            grid-gap: #{fn.rem(80)};
        }
    }

    .coming-soon {
        margin: 0 auto;
        max-width: var(--core-max-width);
        padding: #{fn.rem(100)} 0;

        p {
            width: #{fn.rem(280)};
            height: #{fn.rem(280)};
            border: 1px solid var(--on-base);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            opacity: 0.6;
            font-size: #{fn.rem(14)};

            @media (min-width: var.$breakpoint-lg) {
                width: #{fn.rem(360)};
                height: #{fn.rem(360)};
            }
        }
    }
</style>
