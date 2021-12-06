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
            <span>ausgereifte digitale</span>
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


<Scene />

<style lang="scss">
    @use "src/scss/animations.scss";

    .hero {
        box-sizing: border-box;
        min-height: var(--app-height, 100vh);
        padding: var(--core-padding);
        display: grid;
        grid-template-rows: 1fr auto;
        grid-gap: #{fn.rem(16)};
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
                border: 1px solid hsla(0deg, 0%, 100%, 0.7);
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
            animation: fadein-from-primary 1s ease-in forwards;

            span {
                display: block;
                animation: to-top 0.5s ease-in forwards;
            }
        }

        .bottom {
            grid-column: 1 / span 3;
            display: grid;
            grid-template-columns: auto 1fr auto;
            animation: fadein-from-primary 0.5s ease-in forwards;

            > div {
                grid-column: 2;
            }

            h2, h3 {
                font-size: fn.rem(15);
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
</style>
