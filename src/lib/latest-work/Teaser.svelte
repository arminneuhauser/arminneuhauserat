<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";

    export let scrollY;
    export let title;
    export let year;
    export let desc;
    export let imageSm;
    export let imageLg;

    let teaser;
    let topPosition;
    let windowHeight;
    let relativePosition;
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
        relativePosition = map(topPosition / windowHeight / 1.5, -0.9, -0.5, 0, 1); // opacity 0 when 90%, 1 when 50% scrolled

        if (relativePosition <= 0) {
            opacity = 0;
        } else if (relativePosition > 1) {
            opacity = 1;
        } else {
            opacity = relativePosition;
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
            <picture>
                <source media="(min-width: 768px)" srcset={imageLg}>
                <img src={imageSm} alt={title} loading="lazy" />
            </picture>
        </figure>

        <IntersectionObserver element={element2} bind:intersecting={intersecting2}>
            <footer class:intersecting={intersecting2} bind:this={element2}>
                <p>
                    <span>{desc}</span>
                </p>
                <hr/>
            </footer>
        </IntersectionObserver>
    </div>
</article>

<style lang="scss">
    @use "src/scss/animations.scss";

    .teaser {
        position: relative;
        margin-top: calc(var(--app-height, -100vh) * -1);
        scroll-snap-align: start;

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

        picture {
            flex-basis: 100%;
        }
    }

    footer {
        grid-row: 4;
        margin-top: #{fn.rem(10)};
        width: 100%;
        position: relative;
        z-index: 2;

        @media (min-width: var.$breakpoint-md) {
            grid-column: 1 / span 2;
            grid-row: 3;
            align-self: flex-start;
            margin: 0 0 0 0.3em;
        }

        p {
            font-size: #{fn.rem(14)};
            margin: 0;
            overflow: hidden;

            @media (min-width: var.$breakpoint-md) {
                font-size: #{fn.rfs(18, 24, 768, 1920)};
            }

            span {
                display: inline-flex;
                transform: translate3d(0, 100%, 0);
            }
        }

        hr {
            margin: #{fn.rem(20)} 0 0;
            transform: scaleX(0);
            transform-origin: top left;

            @media (min-width: var.$breakpoint-md) {
                display: none;
            }
        }

        &.intersecting {
            p span {
                animation: to-top 0.8s 0.4s var(--easing) forwards;
            }

            hr {
                animation: scale 0.8s 0.6s var(--easing) forwards;
            }
        }
    }
</style>