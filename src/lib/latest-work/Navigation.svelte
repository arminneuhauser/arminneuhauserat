<script lang="ts">
    export let scrollY;

    let nav;
    let topPosition;
    let relativePosition;
    let windowHeight;

    function parseScroll() {
        topPosition = nav.getBoundingClientRect().top;
        relativePosition = topPosition / windowHeight;

        console.log(relativePosition);
    }
</script>

<svelte:window on:scroll={parseScroll} bind:innerHeight={windowHeight} />

<nav bind:this={nav}>
    <pre>{scrollY}</pre>
    <div></div>
    <div></div>
    <div></div>
</nav>

<style lang="scss">
    nav {
        position: sticky;
        bottom: 0;
        display: flex;
        justify-content: center;
        gap: #{fn.rem(8)};
        padding: 0 var(--core-padding) var(--core-padding);

        div {
            width: #{fn.rem(8)};
            height: #{fn.rem(8)};
            background: var(--on-base);
        }
    }
</style>