<script lang="ts">
    import IntersectionObserver from "svelte-intersection-observer";

    export let image;
    export let width = undefined;
    export let height = undefined;
    export let alt = undefined;

    let element;
    let intersecting;

    let figure;
    let topPosition;
    let windowHeight;
    let relativePosition;
    let translateY = 0;

    // map a number from 1 range to another
    function map(n, start1, end1, start2, end2) {
        return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
    }

    // transform on scroll
    function parseScroll() {
        topPosition = figure.getBoundingClientRect().top;
        relativePosition = topPosition / windowHeight;

        if (relativePosition > -1 && relativePosition < 1) {
            translateY = map(relativePosition, -1, 1, 30, -30);
        }
    }
</script>

<svelte:window on:scroll={parseScroll} bind:innerHeight={windowHeight} />

<IntersectionObserver once {element} bind:intersecting>
    <section class="full">
        <div>
            <figure bind:this={figure}>
                <picture>
                    <img src={image} alt={alt} style="transform: translateY({translateY}%);" width={width} height={height} class:intersecting bind:this={element}>
                </picture>
            </figure>
        </div>
    </section>
</IntersectionObserver>

<style lang="scss">
    section {
        background-color: var(--base);
    }
    figure {
        padding-top: 56.25%; // 16/9
        margin: 0;
        overflow: hidden;
        display: flex;
        position: relative;

    }
    picture {
        position: absolute;
        top: 0;
        width: 100%;
        flex-grow: 1;
        display: flex;
    }
    img {
        flex-grow: 1;
        object-fit: cover;
        opacity: 0;
        transition: opacity 1.2s 0.2s var(--easing);

        &.intersecting {
            opacity: 1;
        }
    }
</style>