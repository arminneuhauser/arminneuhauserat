<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";
    import arrow from './arrow.svg?raw';

    export let slug;
    export let title;
    export let year;
    export let imageSm;
    export let imageLg;

    let teaser;
    let topPosition;
    let windowHeight;
    let relativePosition;
    let mappedOpacityPosition;
    let mappedScalePosition;
    let scale = 1;
    let opacity = 1;

    let element;
    let intersecting;

    let element2;
    let intersecting2;

    // map a number from 1 range to another
    function map(n, start1, end1, start2, end2) {
        return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
    }

    // transform opacity on scroll
    function parseScroll() {
        topPosition = teaser.getBoundingClientRect().top;
        relativePosition = topPosition / windowHeight / 1.5;

        mappedScalePosition = map(relativePosition, -1, 0.5, 1.3, 1);
        mappedOpacityPosition = map(relativePosition, -0.9, -0.4, 0, 1); // opacity 0 when 90%, 1 when 40% scrolled

        if (mappedScalePosition > 1.5) {
            scale = 1.5;
        } else {
            scale = mappedScalePosition;
        }

        if (mappedOpacityPosition <= 0) {
            opacity = 0;
        } else if (mappedOpacityPosition > 1) {
            opacity = 1;
        } else {
            opacity = mappedOpacityPosition;
        }
    }
</script>

<svelte:window on:scroll={parseScroll} bind:innerHeight={windowHeight} />

<article class="teaser" bind:this={teaser} style="opacity: {opacity};">
    <div class="inner">
        <IntersectionObserver {element} bind:intersecting>
            <header class:intersecting bind:this={element}>
                <h1>
                    {title}
                </h1>
                <div>{year}</div>
            </header>
        </IntersectionObserver>

        <figure>
            <a sveltekit:prefetch href="/projekte/{slug}" title="Projekt {title} ansehen">
                <picture>
                    <source media="(min-width: 768px)" srcset={imageLg}>
                    <img src={imageSm} alt={title} style="transform: scale({scale});" />
                </picture>
            </a>
        </figure>

        <IntersectionObserver element={element2} bind:intersecting={intersecting2}>
            <footer class:intersecting={intersecting2} bind:this={element2}>
                <div>    
                    <a sveltekit:prefetch href="/projekte/{slug}" title="Projekt {title} ansehen">
                        <span>
                            <i><i>P</i></i><i><i>r</i></i><i><i>o</i></i><i><i>j</i></i><i><i>e</i></i><i><i>k</i></i><i><i>t</i></i> <i><i>a</i></i><i><i>n</i></i><i><i>s</i></i><i><i>e</i></i><i><i>h</i></i><i><i>e</i></i><i><i>n</i></i>
                        </span>
                        <em>
                            {@html arrow}
                        </em>
                    </a>
                </div>
            </footer>
        </IntersectionObserver>
    </div>
</article>

<style lang="scss">
    @use "src/scss/animations.scss";

    .teaser {
        position: relative;
        margin-top: calc(var(--app-height, -100vh) * -1);
        pointer-events: none;

        &::after {
            content: '';
            display: block;
            height: calc(var(--app-height, 100vh) * 1.5);
            width: 100%;
            pointer-events: none;
            position: relative;
        }
    }

    .inner {
        position: relative;
        top: 0;
        height: var(--app-height, 100vh);
        display: grid;
        grid-template-rows: 1fr repeat(3, auto) 1fr;
        padding: #{fn.rem(80)} var(--core-padding) var(--core-padding);
        box-sizing: border-box;
        max-width: calc(var(--core-max-width) + var(--core-padding) * 2);
        margin: 0 auto;

        > * {
            pointer-events: auto;
        }

        @media (prefers-reduced-motion: no-preference) {
            position: sticky;
        }

        @media (min-width: var.$breakpoint-md) {
            grid-template-columns: minmax(#{fn.rem(50)}, auto) minmax(auto, #{fn.rem(1270)}) minmax(#{fn.rem(50)}, auto);
            grid-template-rows: repeat(4, auto);
            padding-top: #{fn.rem(100)};
            align-items: center;
        }
    }

    header {
        grid-row: 2;
        align-self: end;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.5em;
        width: 100%;
        overflow: hidden;
        flex: 1 0 auto;
        margin-bottom: #{fn.rem(10)};
        position: relative;
        z-index: 3;

        @media (min-width: var.$breakpoint-md) {
            grid-column: 1 / span 2;
            grid-row: 2;
            justify-content: flex-start;
            align-self: flex-end;
            margin-bottom: 0;
            width: auto;
            justify-self: start;

            :global([color-scheme="light"]) &,
            :global([color-scheme="highcontrast"]) & {
                background-color: var(--base);
                padding-right: 1em;
            }
        }

        h1 {
            font-size: #{fn.rem(26)};
            margin: 0;
            transform: translate3d(0, 100%, 0);

            @media (min-width: var.$breakpoint-md) {
                font-size: #{fn.rfs(72, 110, 768, 1920)};
            }
        }

        div {
            font-family: var(--sans);
            font-weight: 400;
            font-size: #{fn.rem(14)};
            transform: translate3d(0, 100%, 0);

            @media (min-width: var.$breakpoint-md) {
                font-size: #{fn.rfs(18, 24, 768, 1920)};
            }
        }

        &.intersecting {
            h1, div {
                animation: to-top 0.8s var(--easing) forwards;
            }
        }
    }

    figure {
        grid-row: 3;
        display: flex;
        margin: 0;
        aspect-ratio: 0.8;
        justify-self: start;
        overflow: hidden;
        width: 100%;
        max-height: 100%;
        position: relative;
        z-index: 1;

        @media (min-width: var.$breakpoint-md) {
            aspect-ratio: 1.77778;
            grid-column: 2;
            grid-row: 2 / span 2;
            justify-self: center;
        }

        a {
            display: flex;
        }

        picture {
            flex-basis: 100%;
            pointer-events: none;
        }

        img {
            transform-origin: bottom center;
        }
    }

    footer {
        grid-row: 4;
        width: 100%;
        position: relative;
        z-index: 2;

        @media (min-width: var.$breakpoint-md) {
            grid-column: 1 / span 2;
            grid-row: 3;
            align-self: flex-start;
            padding: 0 0 0 0.3em;
            width: auto;
            justify-self: start;

            :global([color-scheme="light"]) &,
            :global([color-scheme="highcontrast"]) & {
                background-color: var(--base);
                padding-right: 1em;
            }
        }

        div {
            display: flex;
            align-items: center;
            gap: #{fn.rem(10)};

            &::before {
                content: '';
                height: 1px;
                flex: 1 0 auto;
                background-color: var(--on-base);
                transform-origin: top left;
                transform: scaleX(0) translateY(-0.5px);

                @media (min-width: var.$breakpoint-md) {
                    display: none;
                }
            }

            a {
                display: flex;
                align-items: center;
                gap: #{fn.rem(8)};
                text-transform: uppercase;
                font-size: #{fn.rem(12)};
                font-weight: 500;
                letter-spacing: 0.03em;
                padding: #{fn.rem(10)} 0;

                @media (min-width: var.$breakpoint-md) {
                    font-size: #{fn.rem(14)};
                }

                span {
                    pointer-events: none;
                }

                i {
                    display: inline-flex;
                    overflow: hidden;

                    i {
                        display: inline-flex;
                        transform: translate3d(-100%, 0, 0);
                    }
                }

                em {
                    display: inline-flex;
                    pointer-events: none;
                    overflow: hidden;
                    font-style: normal;

                    :global(svg) {
                        transform: translate3d(-100%, 0, 0);
                    }
                }
            }
        }

        &.intersecting {
            div {
                &::before {
                    animation: scale 0.5s var(--easing) forwards;
                }
            }
            a {
                i {
                    i {
                        animation: to-right 0.2s 0.5s var(--easing) forwards;
                    }
                    &:nth-child(2) i {
                        animation-delay: 0.54s;
                    }
                    &:nth-child(3) i {
                        animation-delay: 0.58s;
                    }
                    &:nth-child(4) i {
                        animation-delay: 0.62s;
                    }
                    &:nth-child(5) i {
                        animation-delay: 0.66s;
                    }
                    &:nth-child(6) i {
                        animation-delay: 0.7s;
                    }
                    &:nth-child(7) i {
                        animation-delay: 0.74s;
                    }
                    &:nth-child(8) i {
                        animation-delay: 0.82s;
                    }
                    &:nth-child(9) i {
                        animation-delay: 0.86s;
                    }
                    &:nth-child(10) i {
                        animation-delay: 0.9s;
                    }
                    &:nth-child(11) i {
                        animation-delay: 0.94s;
                    }
                    &:nth-child(12) i {
                        animation-delay: 0.98s;
                    }
                    &:nth-child(13) i {
                        animation-delay: 1.02s;
                    }
                    &:nth-child(14) i {
                        animation-delay: 1.06s;
                    }
                }

                em {
                    :global(svg) {
                        animation: to-right 0.8s 1.1s var(--easing) forwards;
                    }
                }
            }
        }
    }
</style>