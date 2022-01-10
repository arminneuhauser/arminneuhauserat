<script lang="ts">
    import LinkExternal from '$lib/projects/LinkExternal.svelte';
    import IntersectionObserver from "svelte-intersection-observer";
    import external from '$lib/projects/external.svg?raw';

    export let href;

    let element;
    let intersecting;
</script>

<IntersectionObserver once {element} bind:intersecting>
    <div class="facts" class:intersecting bind:this={element}>
        <slot />
        <LinkExternal href={href}></LinkExternal>
    </div>
</IntersectionObserver>

<style lang="scss">
    .facts {
        max-width: var(--content-max-width);
        margin: #{fn.rem(50)} auto 0;
        font-size: #{fn.rfs(15, 20, $minWidth: 1280, $maxWidth: 2560)};
        opacity: 0;
        transition: opacity 1.2s 0.2s var(--easing);

        &.intersecting {
            opacity: 1;

            :global(div::before) {
                transform: scaleX(1);
            }
        }

        :global(div) {
            display: flex;
            flex-direction: column;
            padding: #{fn.rem(20)} 0;
            gap: #{fn.rem(5)};
            position: relative;

            &::before {
                content: '';
                position: absolute;
                top: 0;
                width: 100%;
                border-top: 1px solid var(--on-base);
                transform: scaleX(0);
                transform-origin: top left;
                transition: transform 0.8s 0.3s var(--easing);
            }
        }

        :global(h3) {
            font-family: var(--serif);
            font-weight: 700;
            font-size: 1.2em;
            margin: 0;
        }

        :global(p) {
            font-size: 1em;
            margin: 0;
        }
    }
</style>