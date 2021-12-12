<script lang="ts">
    import { fade } from "svelte/transition";
    export let refresh = "";
</script>


{#key refresh}
    <div in:fade={{duration: 500, delay: 300}} out:fade={{duration: 500, delay: 300}}>
        <slot />
    </div>

{/key}

<!-- <style lang="scss">
    @use "src/scss/animations.scss";

    .shutter {
        animation: shutter 2s var(--easing) forwards;
        position: fixed;
        left: 0;
        right: 0;
        width: 100%;
        background: var(--base);
        // background: red !important;
        pointer-events: none;
        z-index: 99;
        // opacity: 0.5;
        display: none;
    }
</style> -->
