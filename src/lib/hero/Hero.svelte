<script lang="ts">    
    import DeathStar from '$lib/death-star/DeathStar.svelte';
    import * as animateScroll from "svelte-scrollto";

    export let scrollY;
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
        <button title="runterscrollen" class="scroll-please" on:click={() => animateScroll.scrollTo({element: '.latest-work'})}>
            <div>
                <i></i>
                <i></i>
                <i></i>
                <span class="sr-only">scroll</span>
            </div>
        </button>
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
        grid-gap: #{fn.rem(15)};
        grid-template-columns: auto clamp(#{fn.rem(290)}, 10rem + 28vw, #{fn.rem(2560)}) auto;
        grid-template-rows: 1fr auto;
        min-height: var(--app-height, 100vh);
        padding: var(--core-padding) 0;
        z-index: 1;
    }

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
        grid-template-columns: #{fn.rem(30)} 1fr #{fn.rem(30)};
        padding: 0 var(--core-padding);
        align-items: center;

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
            margin-right: #{fn.rem(-10)};
            padding: #{fn.rem(10)};

            @media (min-width: var.$breakpoint-md) {
                display: none;
            }
        }
    }

    .scroll-please {
        --size: #{fn.rem(7)};

        grid-column: 1;
        position: relative;
        width: #{fn.rem(44)};
        height: #{fn.rem(44)};
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: #{fn.rem(-15)};

        @media (min-width: var.$breakpoint-md) {
            --size: #{fn.rem(9)};
        }

        &:hover {
            div span {
                color: var(--primary);
            }
        }

        div {
            position: relative;
            width: calc(var(--size) + #{fn.rem(2)});
            height: calc((var(--size) + #{fn.rem(2)}) * 3);

            i {
                position: absolute;
                top: 0;
                width: var(--size);
                height: var(--size);
                border: #{fn.rem(1)} solid hsla(var(--on-base-h), var(--on-base-s), var(--on-base-l), 0.5);
                border-radius: 50%;

                @media (prefers-reduced-motion: no-preference) {
                    animation: scroll 1.5s var(--easing) infinite;
                }

                &:nth-child(2) {
                    animation-delay: 0.2s;
                    border-color: hsla(var(--on-base-h), var(--on-base-s), var(--on-base-l), 0.25);
                    transform: translate3d(0, 50%, 0);
                }

                &:nth-child(3) {
                    animation-delay: 0.4s;
                    border-color: hsla(var(--on-base-h), var(--on-base-s), var(--on-base-l), 0.15);
                    transform: translate3d(0, 100%, 0);
                }
            }

            span {
                position: absolute;
                transform: rotate(270deg);
                transform-origin: top left;
                top: #{fn.rem(-8)};
                left: 0;
                left: 1;
                font-size: calc(var(--size) + #{fn.rem(2)});
                line-height: var(--size);
                transition: color 0.2s var(--easing);
            }
        }
    }
</style>