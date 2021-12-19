<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";

    export let scrollY;
    export let title;
    export let year;
    export let desc;
    export let backgroundImage;
    export let previewImage;

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
        relativePosition = map(topPosition / windowHeight, -0.8, -0.25, 0, 1); // opacity 0 when 80%, 1 when 25% scrolled

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
            <img src={previewImage} alt={title} width="656" height="820" loading="lazy" />
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
        // background-color: var(--base);
        position: relative;
        margin-top: -100vh;

        &::after {
            content: '';
            display: block;
            height: 100vh;
            width: 100%;
            pointer-events: none;
            position: relative;
        }
        // &:last-of-type::after {
        //     display: none;
        // }
    }

    .inner {
        position: relative;
        top: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        // grid-template-rows: auto min-content min-content min-content auto;
        padding: #{fn.rem(80)} var(--core-padding) var(--core-padding);
        box-sizing: border-box;

        @media (prefers-reduced-motion: no-preference) {
            position: sticky;
        }

        @media (min-width: var.$breakpoint-md) {
            padding-top: #{fn.rem(100)};
        }
    }

    header {
        // grid-row: 2;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.25em;
        margin: #{fn.rem(10)} 0;
        width: 100%;
        overflow: hidden;

        h1 {
            font-size: #{fn.rfs(24, 36)};
            margin: 0;
            transform: translate3d(0, 100%, 0);
        }

        div {
            font-family: var(--sans);
            font-weight: 400;
            font-size: #{fn.rem(14)};
            transform: translate3d(0, 100%, 0);
        }

        &.intersecting {
            h1, div {
                animation: to-top 0.8s var(--easing) forwards;
            }
        }
    }

    figure {
        // grid-row: 3;
        display: block;
        margin: 0;
        aspect-ratio: 0.8;
        justify-self: start;
        overflow: hidden;
        max-width: 100%;
    }

    footer {
        // grid-row: 4;
        margin: #{fn.rem(10)} 0;
        width: 100%;

        p {
            font-size: #{fn.rem(14)};
            margin: 0;
            overflow: hidden;

            span {
                display: inline-flex;
                transform: translate3d(0, 100%, 0);
            }
        }

        hr {
            margin-top: #{fn.rem(30)};
            transform: scaleX(0);
            transform-origin: top left;
        }

        &.intersecting {
            p span {
                animation: to-top 0.8s var(--easing) forwards;
            }

            hr {
                animation: scale 0.8s 0.5s var(--easing) forwards;
            }
        }
    }
</style>