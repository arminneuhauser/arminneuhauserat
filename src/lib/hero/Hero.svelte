<script lang="ts">
    import DeathStar from '$lib/death-star/DeathStar.svelte';
    import * as animateScroll from "svelte-scrollto";

    export let scrollY;
</script>

<section class="hero">
    <div class="headline">
        <h1 style="transform: translate(0,{scrollY / 4}px)">
            <span>Digital</span>
            <span>Experience</span>
            <span>Creator</span>
        </h1>
        <div class="sphere" style="transform: translate(0,{scrollY / 6}px)"></div>
    </div>
    <div class="bottom" style="transform: translate(0,{scrollY / 8}px)">
        <div>
            <button title="runterscrollen" class="scroll-please" on:click={() => animateScroll.scrollTo({element: '.latest-work'})}>
                <div>
                    <i></i>
                    <i></i>
                    <i></i>
                    <span class="sr-only">scroll</span>
                </div>
            </button>
            <div class="claim">
                <h2>Konzept, Design & Entwicklung</h2>
                <h3>made in Vienna</h3>
            </div>
            <DeathStar/>
        </div>
    </div>
</section>

<style lang="scss">
    @use "src/scss/animations.scss";

    .hero {
        align-items: start;
        box-sizing: border-box;
        display: grid;
        grid-column-gap: 0;
        grid-gap: #{fn.rem(5)};
        grid-template-columns: auto clamp(#{fn.rem(310)}, 11rem + 28vw, #{fn.rem(2560)}) auto;
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
            animation: fadein 2s 1s var(--easing) forwards;
            display: block;
            padding-bottom: 100%;
            background-color: hsla(0, 0%, 100%, 0.5);
            border: 1px solid hsla(0, 0%, 100%, 0.8);
            border-radius: 50%;
            mix-blend-mode: soft-light;
            will-change: opacity;
            opacity: 0;
        }
    }

    h1 {
        opacity: 0;
        animation: fadein-from-primary 2s 0.6s var(--easing) forwards;
        font-family: var(--serif);
        font-weight: 700;
        font-size: fn.rfs(46, 120, 500, 2560);
        line-height: 0.85;
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
        align-items: center;
        z-index: 1;

        :global([color-scheme="highcontrast"]) & {
            line-height: 1;

            span {
                margin: 0 !important;
            }
        }

        span {
            display: block;

            &:first-child {
                margin-right: 0.6em;
            }

            &:last-child {
                margin-left: 1em;
            }

            @media (prefers-reduced-motion: no-preference) {
                animation: to-top-10 0.5s var(--easing) forwards;
            }
        }
    }

    .bottom {
        grid-column: 1 / span 3;
        padding: 0 var(--core-padding);

        > div {
            display: grid;
            grid-template-columns: #{fn.rem(30)} 1fr #{fn.rem(30)};
            max-width: var(--core-max-width);
            margin: 0 auto;
            align-items: center;

            @media (min-width: var.$breakpoint-md) {
                grid-template-columns: #{fn.rem(44)} 1fr #{fn.rem(44)};
            }

            @media (prefers-reduced-motion: no-preference) {
                animation: fadein-from-primary 0.5s var(--easing) forwards;
            }
        }

        .claim {
            grid-column: 2;
        }

        h2, h3 {
            font-size: #{fn.rfs(15, 20, $minWidth: 1280, $maxWidth: 2560)};
            font-weight: 400;
            margin: 0;
            text-align: center;
            opacity: 0.75;

            :global([color-scheme="highcontrast"]) & {
                opacity: 1;
            }
        }

        :global(.death-star) {
            margin-right: #{fn.rem(-13)};
            padding: #{fn.rem(10)};

            @media (min-width: var.$breakpoint-md) {
                display: none;
            }
        }
    }

    .scroll-please {
        --size: #{fn.rem(7)};

        grid-column: 1;
        grid-row: 1;
        position: relative;
        width: #{fn.rem(44)};
        height: #{fn.rem(44)};
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: #{fn.rem(-17)};

        @media (min-width: var.$breakpoint-md) {
            --size: #{fn.rem(9)};

            grid-column: 3;
            margin-left: #{fn.rem(15)};
        }

        @media (min-width: var.$breakpoint-lg) {
            --size: #{fn.rem(10)};
        }

        @media (min-width: var.$breakpoint-1xl) {
            --size: #{fn.rem(12)};
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
            pointer-events: none;

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