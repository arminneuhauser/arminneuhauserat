<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";

    let element;
    let intersecting;
</script>

<IntersectionObserver {element} bind:intersecting>
    <section class="wisdom">
        <p class:intersecting bind:this={element}>Meine Webseiten sind wie gute Fahrräder: elegant, hochwertig, auf den Benutzer angepasst und vor allem pfeilschnell.</p>
    </section>
</IntersectionObserver>

<style lang="scss">
    .wisdom {
        align-items: center;
        display: grid;
        grid-gap: 0;
        grid-template-columns: auto clamp(#{fn.rem(280)}, 10rem + 30vw, #{fn.rem(2560)}) auto;
        justify-content: center;
        min-height: 100vh;
        padding: var(--core-padding);
        max-width: var(--core-max-width);
        margin: 0 auto;

        p {
            grid-column: 2;
            font-size: fn.rfs(28, 72);
            font-weight: 700;
            line-height: 1.15;
            // color: hsl(var(--hue), 70%, 95%);
            // text-shadow: -0.05em 0.05em 0.02em hsl(var(--hue), 80%, 30%);
            transform: translate(0, #{fn.rem(200)});
            transition: transform 1.5s var(--easing);

            &.intersecting {
                transform: translate(0, 0);
            }
        }
    }
</style>