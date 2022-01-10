<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";

    export let src;
    export let width = undefined;
    export let height = undefined;
    export let alt = undefined;

    let element;
    let intersecting;
</script>

<IntersectionObserver once {element} bind:intersecting>
    <img src={src} alt={alt} width={width} height={height} class:intersecting bind:this={element}>
</IntersectionObserver>

<style lang="scss">
    img {
        opacity: 0;
        transition: opacity 1.2s 0.2s var(--easing);

        &.intersecting {
            opacity: 1;
        }
    }
</style>