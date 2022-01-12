<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";

    export let slug;
    export let title;
    export let year;
    export let desc;
    export let image;

    let element;
    let intersecting;

    let element2;
    let intersecting2;

    let element3;
    let intersecting3;
</script>

<article class="teaser">
    <div class="inner">
        <IntersectionObserver once {element} bind:intersecting>
            <header class:intersecting bind:this={element}>
                <h1>
                    <a sveltekit:prefetch href="/projekte/{slug}" title="Projekt {title} ansehen"><span data-title={title}>{title}</span></a>
                </h1>
                <div>
                    <a sveltekit:prefetch href="/projekte/{slug}" title="Projekt {title} ansehen"><span data-title={year}>{year}</span></a>
                </div>
            </header>
        </IntersectionObserver>

        <IntersectionObserver once element={element2} bind:intersecting={intersecting2}>
            <figure  class:intersecting={intersecting2} bind:this={element2}>
                <a sveltekit:prefetch href="/projekte/{slug}" title="Projekt {title} ansehen">
                    <picture>
                        <img src={image} alt={title} width="656" height="820" loading="lazy" />
                    </picture>
                </a>
            </figure>
        </IntersectionObserver>

        <IntersectionObserver once element={element3} bind:intersecting={intersecting3}>
            <footer class:intersecting={intersecting3} bind:this={element3}>
                <p>
                    <a sveltekit:prefetch href="/projekte/{slug}" title="Projekt {title} ansehen">{desc}</a>
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
    }

    .inner {
        position: relative;
        top: 0;
        display: grid;
        grid-template-rows: 1fr repeat(3, auto) 1fr;
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
        flex: 1 0 auto;
        margin-bottom: #{fn.rem(10)};
        position: relative;
        z-index: 3;

        &.intersecting {
            a span {
                transform: translate3d(0, 0, 0);
            }
        }

        a {
            display: inline-flex;
            overflow: hidden;

            span {
                transform: translate3d(0, 100%, 0);
                transition: transform 0.8s var(--easing);
                position: relative;
                pointer-events: none;

                &::after {
                    content: attr(data-title);
                    position: absolute;
                    left: 0;
                    top: 0;
                    transform: translate3d(0, 100%, 0);
                }
            }

            &:hover span {
                transform: translate3d(0, -100%, 0);
            }
        }

        h1 {
            font-size: #{fn.rfs(26, 38, $minWidth: 1440, $maxWidth: 2560)};
            margin: 0;
        }

        div {
            font-family: var(--sans);
            font-weight: 400;
            font-size: #{fn.rfs(14, 16, $minWidth: 1440, $maxWidth: 2560)};
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
        opacity: 0;

        picture {
            flex-basis: 100%;
            pointer-events: none;
        }

        &.intersecting {
            animation: fadein 1s var(--easing) forwards;
        }
    }

    footer {
        grid-row: 4;
        margin-top: #{fn.rem(10)};
        width: 100%;
        position: relative;
        z-index: 2;

        p {
            font-size: #{fn.rfs(14, 16, $minWidth: 1440, $maxWidth: 2560)};
            margin: 0;
            overflow: hidden;

            a {
                display: inline-flex;
                transform: translate3d(0, 100%, 0);
            }
        }

        hr {
            margin: #{fn.rem(20)} 0 0;
            transform: scaleX(0);
            transform-origin: top left;
        }

        &.intersecting {
            p a {
                animation: to-top 0.8s 0.2s var(--easing) forwards;
            }

            hr {
                animation: scale 0.8s 0.3s var(--easing) forwards;
            }
        }
    }
</style>
