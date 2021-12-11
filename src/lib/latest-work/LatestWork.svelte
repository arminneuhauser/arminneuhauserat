<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";

	export let scrollY;

    let element;
    let intersecting;
    let element2;
    let intersecting2;
    let element3;
    let intersecting3;
</script>

<section class="latest-work">

    <IntersectionObserver {element} bind:intersecting>
        <h1 class="headline" class:intersecting bind:this={element}>
            <span style="transform: translate({-scrollY / 4 - 150}px,0)">
                <span>
                    <i>Meine</i> Projekte
                    <i>Meine</i> Projekte
                    <i>Meine</i> Projekte
                    <i>Meine</i> Projekte
                </span>
            </span>
        </h1>
    </IntersectionObserver>

    <div class="projects">
        <div>
            <article class="teaser">
                <a href="#todo">
                    <figure>
                        <img src="/images/mst-muhr.jpg" alt="MST Muhr" />
                    </figure>
                    <h1>
                        MST Muhr
                        <span>2022</span>
                    </h1>
                </a>
            </article>
            <article class="teaser">
                <a href="#todo">
                    <figure>
                        <img src="/images/cartagena.jpg" alt="Solmates" />
                    </figure>
                    <h1>
                        Solmates
                        <span>2019</span>
                    </h1>
                </a>
            </article>
            <article class="teaser">
                <a href="#todo">
                    <figure>
                        <img src="/images/wohnformat.jpg" alt="Wohnformat" />
                    </figure>
                    <h1>
                        [wohnformat]
                        <span>2018</span>
                    </h1>
                </a>
            </article>
        </div>
    </div>

</section>

<style lang="scss">
    .latest-work {
        box-sizing: border-box;
        min-height: 100vh;
        padding: #{fn.rem(100)} 0;

        > h1 {
            font-size: #{fn.rfs(40, 140, 360, 2560)};
            font-weight: 400;
            white-space: nowrap;
            overflow: hidden;
            margin: 0;

            span {
                display: inline-block;

                span {
                    transform: translate(0, 100%);
                    transition: transform 0.5s var(--easing);
                }
            }

            &.intersecting {
                span span {
                    transform: translate(0, 0);
                }
            }

            i {
                font-family: var(--serif);
                font-style: normal;
                font-weight: 700;
            }
        }
    }
    
    .projects {
        padding-top: #{fn.rem(40)};
        overflow: visible;
        position: relative;
        z-index: 1;

        > div {
            margin-top: 100vh;
        }
    }

    .teaser {
        background: var(--base);
        position: relative;
        margin-top: -100vh;

        &::after {
            content: '';
            display: block;
            height: 100vh;
            width: 100vw;
        }

        > a {
            position: sticky;
            top: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        figure {
            position: absolute;
            width: 100%;
            height: 100%;
            margin: 0;
            z-index: -1;
        }

        img {
            position: absolute;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        h1 {
            font-family: var(--serif);
            font-size: #{fn.rfs(36, 70)};
            margin: 0.25em 0;
            display: flex;
            align-items: baseline;
            gap: 0.25em;

            span {
                font-family: var(--sans-serif);
                font-weight: 400;
                font-size: #{fn.rfs(15, 18)};
            }
        }

        @media (min-width: var.$breakpoint-lg) {
            &:nth-child(2) {
                margin-top: #{fn.rem(80)};
            }
        }
    }
</style>
