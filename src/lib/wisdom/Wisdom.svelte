<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";

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
        }
    }
</style>