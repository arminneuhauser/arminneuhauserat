<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";
    import { fade } from "svelte/transition";

    export let src;
    export let srcWebm = undefined;
    export let width = undefined;
    export let height = undefined;
    export let alt = undefined;
    export let poster = undefined;

    let node;
</script>

<IntersectionObserver once element={node} let:intersecting>
    <div bind:this={node}>
        {#if intersecting}
            <video in:fade={{delay: 200, duration: 1200}} width={width} height={height} muted playsinline loop autoplay poster={poster} class:intersecting >
                <source src={srcWebm} type="video/webm">
                <source src={src} type="video/mp4">
            </video>
        {/if}
    </div>
</IntersectionObserver>
