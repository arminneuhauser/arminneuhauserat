<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";
    import Teaser from "./Teaser.svelte";
    import wheel from './wheel.svg?raw';

	export let scrollY;

    let element;
    let intersecting;
</script>

<section class="latest-work">

    <IntersectionObserver {element} bind:intersecting>
        <h1 class="headline" class:intersecting bind:this={element}>
            <span style="transform: translate({-scrollY / 4 - 150}px,0)">
                <span>
                    <em>Meine</em> Projekte <i style="transform: rotate({scrollY / 4 - 150}deg)">{@html wheel}</i>
                    <em>Meine</em> Projekte <i style="transform: rotate({scrollY / 4 - 150}deg)">{@html wheel}</i>
                    <em>Meine</em> Projekte <i style="transform: rotate({scrollY / 4 - 150}deg)">{@html wheel}</i>
                    <em>Meine</em> Projekte <i style="transform: rotate({scrollY / 4 - 150}deg)">{@html wheel}</i>
                </span>
            </span>
        </h1>
    </IntersectionObserver>

    <div class="projects">
        <div>
            <Teaser 
                title="MST Muhr"
                year="2022"
                previewImage="/images/mst-muhr.jpg">
            </Teaser>

            <Teaser 
                title="Solmates"
                year="2019"
                previewImage="/images/cartagena.jpg">
            </Teaser>

            <Teaser 
                title="[wohnformat]"
                year="2018"
                previewImage="/images/wohnformat.jpg">
            </Teaser>
        </div>
    </div>

</section>

<style lang="scss">
    .latest-work {
        box-sizing: border-box;
        min-height: 100vh;
        padding: #{fn.rem(70)} 0 0;

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
        padding-top: #{fn.rem(40)};
        overflow: visible;
        position: relative;
        z-index: 1;

        > div {
            margin-top: 100vh;
        }
    }
</style>
