<script lang="ts">
    // https://svelte.dev/tutorial/spring
    import IntersectionObserver from "svelte-intersection-observer";
    import { spring } from 'svelte/motion';
    import Teaser from "./Teaser.svelte";
    import wheel from './wheel.svg?raw';

	export let scrollY;

    let element;
    let intersecting;

    let shift = spring(scrollY, {
        stiffness: 0.1,
        damping: 1
    });
    
    let spin = spring(scrollY, {
        stiffness: 0.1,
        damping: 0.8
    });

    function parseScroll() {
        shift.set(-scrollY / 4 - 150)
        spin.set(scrollY / 2)
    }
</script>

<svelte:window on:scroll={parseScroll} />

<section class="latest-work">

    <IntersectionObserver {element} bind:intersecting>
        <h1 class="headline" class:intersecting bind:this={element}>
            <span style="transform: translate({$shift}px,0)">
                <span>
                    <em>Meine</em> Projekte <i style="transform: rotate({$spin}deg)">{@html wheel}</i>
                    <em>Meine</em> Projekte <i style="transform: rotate({$spin}deg)">{@html wheel}</i>
                    <em>Meine</em> Projekte <i style="transform: rotate({$spin}deg)">{@html wheel}</i>
                    <em>Meine</em> Projekte <i style="transform: rotate({$spin}deg)">{@html wheel}</i>
                </span>
            </span>
        </h1>
    </IntersectionObserver>

    <div class="projects">
        <div>
            <Teaser 
                scrollY={scrollY}
                title="MST Muhr"
                year="2022"
                desc="Webdesign, Development, CMS, Fotografie"
                imageSm="/images/mst-muhr/mst-muhr.jpg"
                imageLg="/images/mst-muhr/mst-muhr-lg.jpg"
            >
            </Teaser>

            <Teaser 
                scrollY={scrollY}
                title="Solmates"
                year="2019"
                desc="Design, Development, CMS, Fotografie, Texte"
                imageSm="/images/solmates/solmates.jpg"
                imageLg="/images/solmates/solmates-lg.jpg"
            >
            </Teaser>

            <Teaser 
                scrollY={scrollY}
                title="[wohnformat]"
                year="2016"
                desc="CI, Webdesign, Development, CMS"
                imageSm="/images/wohnformat/wohnformat.jpg"
                imageLg="/images/wohnformat/wohnformat-lg.jpg"
            >
            </Teaser>
        </div>
    </div>

</section>

<style lang="scss">
    .latest-work {
        box-sizing: border-box;
        min-height: var(--app-height, 100vh);
        padding: #{fn.rem(140)} 0 0;

        > h1 {
            font-size: #{fn.rfs(40, 140, 360, 2560)};
            font-weight: 400;
            white-space: nowrap;
            overflow: hidden;
            margin: 0;

            span {
                display: inline-block;

                span {
                    display: flex;
                    gap: 0.25em;
                    align-items: baseline;
                    transform: translate(0, 100%);
                    transition: transform 0.5s var(--easing);
                }
            }

            &.intersecting {
                span span {
                    transform: translate(0, 0);
                }
            }

            em {
                font-family: var(--serif);
                font-style: normal;
                font-weight: 700;
            }

            i {
                align-self: center;
                line-height: 0;

                :global(svg) {
                    width: 1em;
                    height: 1em;
                }
            }
        }
    }
    
    .projects {
        overflow: visible;
        position: relative;

        > div {
            margin-top: calc(var(--app-height, 100vh) - #{fn.rem(40)});
        }
    }
</style>
