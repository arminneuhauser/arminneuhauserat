<script lang="ts">
    export let image;
    export let alt;

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

        // console.log(relativePosition)

        if (relativePosition > -1 && relativePosition < 1) {
            // console.log("visible")
            // translateY = relativePosition * 100;
            translateY = map(relativePosition, -1, 1, 30, -30);
        }

        // mappedScalePosition = map(relativePosition, -1, 0.5, 1.3, 1);
        // mappedOpacityPosition = map(relativePosition, -0.9, -0.4, 0, 1); // opacity 0 when 90%, 1 when 40% scrolled

        // if (mappedScalePosition > 1.5) {
        //     scale = 1.5;
        // } else {
        //     scale = mappedScalePosition;
        // }

        // if (mappedOpacityPosition <= 0) {
        //     opacity = 0;
        // } else if (mappedOpacityPosition > 1) {
        //     opacity = 1;
        // } else {
        //     opacity = mappedOpacityPosition;
        // }
    }
</script>

<svelte:window on:scroll={parseScroll} bind:innerHeight={windowHeight} />

<section class="full">
    <div>
        <figure bind:this={figure}>
            <picture>
                <img src={image} alt={alt} style="transform: translateY({translateY}%);">
            </picture>
        </figure>
    </div>
</section>

<style lang="scss">
    section {
        background-color: var(--base);
    }
    figure {
        aspect-ratio: 2;
        margin: 0;
        overflow: hidden;
        display: flex;
    }
</style>