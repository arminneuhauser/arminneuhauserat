<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";
    import { fly } from "svelte/transition";

    let element;
</script>

<IntersectionObserver {element} let:intersecting>
    <section class="wisdom">
        <div bind:this={element}>
            {#if intersecting}
                <p>
                    <span class="mask"><span in:fly="{{ y: 200, duration: 1200, delay: 0 }}">Meine Webseiten</span></span>
                    <span class="mask"><span in:fly="{{ y: 200, duration: 1200, delay: 50 }}">sind wie gute</span></span>
                    <span class="mask"><span in:fly="{{ y: 200, duration: 1200, delay: 100 }}">Fahrräder:</span></span>
                    <span class="mask"><span in:fly="{{ y: 200, duration: 1200, delay: 150 }}">elegant, hochwertig,</span></span>
                    <span class="mask"><span in:fly="{{ y: 200, duration: 1200, delay: 200 }}">auf den Benutzer</span></span>
                    <span class="mask"><span in:fly="{{ y: 200, duration: 1200, delay: 250 }}">angepasst und vor</span></span>
                    <span class="mask"><span in:fly="{{ y: 200, duration: 1200, delay: 300 }}">allem pfeilschnell.</span></span>
                </p>
            {/if}
        </div>
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
        overflow: hidden;
        margin-top: -50vh;
        position: relative;

        div {
            grid-column: 2;
        }

        p {
            font-size: fn.rfs(26, 72);
            font-weight: 500;
            line-height: 1.2;
            // color: hsl(var(--hue), 70%, 95%);
            // text-shadow: -0.05em 0.05em 0.02em hsl(var(--hue), 80%, 30%);
            // transform: translate(#{fn.rem(200)}, 0);
            // transition: transform 0.5s var(--easing);

            // &.intersecting {
            //     transform: translate(0, 0);
            // }
        }
    }

    .mask {
        display: inline-flex;
        overflow: hidden;
    }
</style>