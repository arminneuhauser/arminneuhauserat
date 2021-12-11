<script lang="ts">
    export let scrollY;

    import DeathStar from '$lib/death-star/DeathStar.svelte';
</script>

<section class="hero">
    <div class="headline">
        <h1 style="transform: translate(0,{-scrollY / 7}px)">
            <span>Ich erschaffe</span>
            <span>ausgefeilte digitale</span>
            <span>Erlebnisse im Web,</span>
            <span>jeden Tag.</span>
        </h1>
        <div class="sphere" style="transform: translate(0,{-scrollY / 10}px)"></div>
    </div>
    <div class="bottom" style="transform: translate(0,{-scrollY / 5}px)">
        <div>
            <h2>Konzept, Design & Entwicklung</h2>
            <h3>made in Vienna</h3>
        </div>
        <DeathStar/>
    </div>
</section>

<style lang="scss">
    @use "src/scss/animations.scss";

    .hero {
        align-items: start;
        box-sizing: border-box;
        display: grid;
        grid-column-gap: 0;
        grid-gap: #{fn.rem(16)};
        grid-template-columns: auto clamp(#{fn.rem(320)}, 10rem + 28vw, #{fn.rem(2560)}) auto;
        grid-template-rows: 1fr auto;
        min-height: var(--app-height, 100vh);
        padding: var(--core-padding) 0;
        z-index: 1;

        .headline {
            position: relative;
            aspect-ratio: 1;
            align-self: center;
            grid-column: 2;

            .sphere {
                display: block;
                padding-bottom: 100%;
                background-color: hsla(0, 0%, 100%, 0.5);
                border: 1px solid hsla(0, 0%, 100%, 0.8);
                border-radius: 50%;
                mix-blend-mode: soft-light;
            }
        }

        h1 {
            font-family: var(--serif);
            font-weight: 700;
            font-size: fn.rfs(25, 72, 360, 2560);
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
                animation: fadein-from-primary 2s var(--easing) forwards;
            }

            span {
                display: block;

                @media (prefers-reduced-motion: no-preference) {
                    animation: to-top 0.5s var(--easing) forwards;
                }
            }
        }

        .bottom {
            grid-column: 1 / span 3;
            display: grid;
            grid-template-columns: auto 1fr auto;
            padding: 0 var(--core-padding);

            @media (prefers-reduced-motion: no-preference) {
                animation: fadein-from-primary 0.5s var(--easing) forwards;
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
            }

            :global(#death-star) {
                @media (min-width: var.$breakpoint-md) {
                    display: none;
                }
            }
        }
    }
</style>