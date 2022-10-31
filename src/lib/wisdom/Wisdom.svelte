<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";
    import arrow from '../latest-work/arrow.svg?raw';

    let element;
    let intersecting;

    // TODO: nicht im let modus, weil sonst die höhe vom p nicht passt
</script>

<IntersectionObserver {element} bind:intersecting>
    <section class="wisdom">
        <div>
            <p class:intersecting bind:this={element}>
                <span class="mask"><span>Meine Webseiten</span></span>
                <span class="mask"><span>sind wie gute</span></span>
                <span class="mask"><span>Fahrräder:</span></span>
                <span class="mask"><span>elegant, hochwertig,</span></span>
                <span class="mask"><span>auf den Benutzer</span></span>
                <span class="mask"><span>angepasst und vor</span></span>
                <span class="mask"><span>allem pfeilschnell.</span></span>
                <a sveltekit:prefetch href="/ueber-mich" title="Mehr über mich erfahren">
                    <span>
                        <span data-title="Mehr über mich" aria-hidden="true">
                            <i><i>M</i></i><i><i>e</i></i><i><i>h</i></i><i><i>r</i></i> <i><i>ü</i></i><i><i>b</i></i><i><i>e</i></i><i><i>r</i></i> <i><i>m</i></i><i><i>i</i></i><i><i>c</i></i><i><i>h</i></i>
                        </span>
                    </span>
                    <em>
                        {@html arrow}
                    </em>
                </a>
            </p>
        </div>
    </section>
</IntersectionObserver>

<style lang="scss">
    @use "src/scss/animations.scss";

    .wisdom {
        align-items: center;
        display: grid;
        grid-gap: 0;
        grid-template-columns: auto clamp(#{fn.rem(280)}, 10rem + 30vw, #{fn.rem(2560)}) auto;
        justify-content: center;
        padding: #{fn.rem(70)} var(--core-padding);
        max-width: var(--core-max-width);
        margin: 0 auto;
        overflow: hidden;
        margin-top: -50vh;
        position: relative;

        div {
            grid-column: 2;
        }
    }

    p {
        font-size: fn.rfs(26, 72);
        font-weight: 500;
        line-height: 1.2;

        &.intersecting {
            .mask {
                span {
                    animation: to-top 1.2s var(--easing) forwards;
                }
                &:nth-child(2) span {
                    animation-delay: 200ms;
                }
                &:nth-child(3) span {
                    animation-delay: 400ms;
                }
                &:nth-child(4) span {
                    animation-delay: 600ms;
                }
                &:nth-child(5) span {
                    animation-delay: 800ms
                }
                &:nth-child(6) span {
                    animation-delay: 1000ms;
                }
                &:nth-child(7) span {
                    animation-delay: 1200ms;
                }
            }

            a {
                i {
                    i {
                        animation: to-right 0.2s 2000ms var(--easing) forwards;
                    }
                    &:nth-child(2) i {
                        animation-delay: 2040ms;
                    }
                    &:nth-child(3) i {
                        animation-delay: 2080ms;
                    }
                    &:nth-child(4) i {
                        animation-delay: 2120ms;
                    }
                    &:nth-child(5) i {
                        animation-delay: 2160ms;
                    }
                    &:nth-child(6) i {
                        animation-delay: 2200ms;
                    }
                    &:nth-child(7) i {
                        animation-delay: 2240ms;
                    }
                    &:nth-child(8) i {
                        animation-delay: 2280ms;
                    }
                    &:nth-child(9) i {
                        animation-delay: 2320ms;
                    }
                    &:nth-child(10) i {
                        animation-delay: 2360ms;
                    }
                    &:nth-child(11) i {
                        animation-delay: 2400ms;
                    }
                    &:nth-child(12) i {
                        animation-delay: 2440ms;
                    }
                }

                em {
                    :global(svg) {
                        animation: to-right 0.8s 2480ms var(--easing) forwards;
                    }
                }
            }
        }
    }

    a {
        display: inline-flex;
        align-items: center;
        gap: #{fn.rem(8)};
        text-transform: uppercase;
        font-size: #{fn.rem(12)};
        font-weight: 500;
        letter-spacing: 0.03em;
        padding: #{fn.rem(10)} 0;
        margin: 2em 0;

        @media (min-width: var.$breakpoint-md) {
            font-size: #{fn.rem(14)};
        }

        span {
            overflow: hidden;
            display: flex;
            position: relative;
            pointer-events: none;

            span {
                display: inline-block;
                transform: translate3d(0, 0, 0);
                transition: transform 0.8s var(--easing);
                position: relative;
                overflow: visible;

                &::after {
                    content: attr(data-title);
                    position: absolute;
                    left: 0;
                    top: 0;
                    transform: translate3d(0, 100%, 0);
                }
            }
        }

        &:hover span span {
            transform: translate3d(0, -100%, 0);
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
</style>