<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";

    export let title;
    export let desc;
    export let slug;
    export let image;

    let element;
    let intersecting;
</script>

<section class="next">
    <IntersectionObserver once {element} bind:intersecting>
        <div class:intersecting bind:this={element}>
            <h3>Nächstes Projekt</h3>
            <a href={slug} class="circle" style="background-image: url({image});">
                <div class="text">
                    <h1>{title}</h1>
                    <hr>
                    <p>{desc}</p>
                </div>
            </a>
        </div>
    </IntersectionObserver>
</section>

<style lang="scss">
    .next {
        background: none;
        min-height: var(--app-height, 100vh);
        padding: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        > div {
            opacity: 0;
            transition: opacity 1.2s 0.2s var(--easing);

            &.intersecting {
                opacity: 1;
            }
        }

        h3 {
            font-size: #{fn.rem(24)};
            margin: 2em;
            text-align: center;
        }

        .circle {
            height: #{fn.rem(320)};
            width: #{fn.rem(320)};
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background-size: cover;
            background-position: center center;
            position: relative;

            @media (min-width: var.$breakpoint-md) {
                height: #{fn.rem(460)};
                width: #{fn.rem(460)};
            }
        }

        .text {
            text-align: center;
            pointer-events: none;
            color: #fff;

            h1 {
                font-family: var(--serif);
                font-weight: 700;
                font-size: #{fn.rem(36)};
                line-height: 1;
                margin: 0.5em 0;

                @media (min-width: var.$breakpoint-md) {
                    font-size: #{fn.rem(42)};
                }

                @media (min-width: var.$breakpoint-lg) {
                    font-size: #{fn.rem(48)};
                }
            }

            hr {
                width: 33%;
                border-color: currentColor;
            }

            p {
                font-size: #{fn.rem(15)};

                @media (min-width: var.$breakpoint-md) {
                    font-size: #{fn.rem(16)};
                }

                @media (min-width: var.$breakpoint-lg) {
                    font-size: #{fn.rem(18)};
                }
            }      
        }
    }
</style>
