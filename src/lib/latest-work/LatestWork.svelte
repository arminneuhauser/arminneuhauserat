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
            <span style="transform: translate({-scrollY / 4 - 200}px,0)">
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
        <IntersectionObserver element={element2} bind:intersecting={intersecting2}>
            <article class="teaser" class:intersecting={intersecting2} bind:this={element2}>
                <div>
                    <img src="/images/cartagena.jpg" alt="Solmates" />
                    <h1>
                        Solmates
                        <span>2019</span>
                    </h1>
                </div>
            </article>
        </IntersectionObserver>
        <IntersectionObserver element={element3} bind:intersecting={intersecting3}>
            <article class="teaser" class:intersecting={intersecting3} bind:this={element3}>
                <div>
                    <img src="/images/wohnformat.jpg" alt="Wohnformat" />
                    <h1>
                        Wohnformat
                        <span>2018</span>
                    </h1>
                </div>
            </article>
        </IntersectionObserver>
    </div>

</section>

<style lang="scss">
    .latest-work {
        align-items: start;
        box-sizing: border-box;
        display: grid;
        grid-gap: #{fn.rem(16)};
        min-height: 100vh;
        padding: #{fn.rem(100)} 0;
        overflow: hidden;

        > h1 {
            font-size: #{fn.rfs(40, 140, 360, 2560)};
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
            }
        }
    }
    
    .projects {
        display: grid;
        grid-gap: #{fn.rem(20)};
        justify-content: center;
        padding: var(--core-padding);
        max-width: var(--core-max-width);
        margin: 0 auto;

        @media (min-width: var.$breakpoint-lg) {
            grid-template-columns: 1fr 1fr;
            grid-gap: 2.5vw;
        }
    }

    .teaser {
        > div {
            transition: transform 1.5s var(--easing);
        }

        &:nth-child(odd) > div {
            transform: translate(#{fn.rem(-50)}, #{fn.rem(200)});
        }

        &:nth-child(even) > div {
            transform: translate(#{fn.rem(50)}, #{fn.rem(200)});
        }

        &.intersecting > div {
            transform: translate(0, 0);
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
                color: var(--primary);
            }
        }

        @media (min-width: var.$breakpoint-lg) {
            &:nth-child(2) {
                margin-top: #{fn.rem(80)};
            }
        }
    }
</style>
