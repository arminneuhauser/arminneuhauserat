<script context="module" lang="ts">
    export const prerender = true;
</script>

<script lang="ts">
    import Scene from '$lib/scene/Scene.svelte';
    import DeathStar from '$lib/death-star/DeathStar.svelte';
</script>

<svelte:head>
    <title>Armin Neuhauser | Webdesign</title>
</svelte:head>

<section class="hero">
    <div class="sphere">
        <h1>
            <span>Ich erschaffe</span>
            <span>ausgefeilte digitale</span>
            <span>Erlebnisse im Web,</span>
            <span>jeden Tag.</span>
        </h1>
    </div>
    <div class="bottom">
        <div>
            <h2>Konzept, Design & Entwicklung</h2>
            <h3>made in Vienna</h3>
        </div>
        <DeathStar/>
    </div>
</section>

<section class="wisdom">
    <p>Meine Webseiten sind wie gute Fahrräder: elegant, hochwertig, auf den Benutzer angepasst und vor allem pfeilschnell.</p>
</section>

<Scene />

<style lang="scss">
    @use "src/scss/animations.scss";

    section {
        box-sizing: border-box;
        min-height: 100vh;
        padding: var(--core-padding);
        display: grid;
        grid-gap: #{fn.rem(16)};
    }

    .hero {
        min-height: var(--app-height, 100vh);
        grid-template-rows: 1fr auto;
        grid-template-columns: auto minmax(auto, #{fn.rem(480)}) auto;

        .sphere {
            position: relative;
            aspect-ratio: 1;
            align-self: center;
            grid-column: 2;

            &::after {
                content: "";
                display: block;
                padding-bottom: 100%;
                background-color: hsla(0deg, 0%, 100%, 0.5);
                border: 1px solid hsla(0deg, 0%, 100%, 0.8);
                border-radius: 50%;
                mix-blend-mode: soft-light;
            }
        }

        h1 {
            font-family: "serif";
            font-weight: 400;
            font-size: fn.rfs(24, 36);
            line-height: 1.1;
            text-align: center;
            margin: 0;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            z-index: 1;
            
            @media (prefers-reduced-motion: no-preference) {
                animation: fadein-from-primary 1s ease-out forwards;
            }

            span {
                display: block;

                @media (prefers-reduced-motion: no-preference) {
                    animation: to-top 0.5s ease-out forwards;
                }
            }
        }

        .bottom {
            grid-column: 1 / span 3;
            display: grid;
            grid-template-columns: auto 1fr auto;

            @media (prefers-reduced-motion: no-preference) {
                animation: fadein-from-primary 0.5s ease-out forwards;
            }

            > div {
                grid-column: 2;
            }

            h2, h3 {
                font-size: #{fn.rfs(15, 20, $minWidth: 1280, $maxWidth: 2560)};
                font-weight: 400;
                margin: 0;
                text-align: center;
                color: var(--on-base);
                opacity: 0.7;

                [color-scheme="dark"] & {
                    mix-blend-mode: exclusion;
                }
            }

            :global(#death-star) {
                @media (min-width: var.$breakpoint-md) {
                    display: none;
                }
            }
        }
    }

    .wisdom {
        align-items: center;
        justify-content: center;
        grid-template-columns: auto minmax(auto, #{fn.rem(560)}) auto;

        p {
            grid-column: 2;
            font-size: fn.rfs(36, 48);
            font-weight: 500;
        }
    }
</style>
