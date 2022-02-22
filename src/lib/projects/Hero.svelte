<script lang="ts">
    import { onMount, onDestroy, afterUpdate } from 'svelte';

    export let title;
    export let desc;
    export let imageSm;
    export let imageLg;

    let scrollY;
    let windowHeight;
    let lightness = 100;
    let root = document.documentElement;

    // map a number from 1 range to another
    function map(n, start1, end1, start2, end2) {
        return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
    }

    onMount(() => {
        root?.style.setProperty('--header-color', `hsl(0deg, 0%, 100%)`)
    });

    afterUpdate(() => {
        if (scrollY == 0) {
            root?.style.setProperty('--header-color', `hsl(0deg, 0%, 100%)`)
        }
    });

    onDestroy(() => {
        root?.style.removeProperty('--header-color')
    });

    function parseScroll() {
        lightness = Math.min(Math.max(map(scrollY / windowHeight, 0.9, 1, 100, 0), 0), 100);
        root?.style.setProperty('--header-color', `hsl(0deg, 0%, ${lightness}%)`)
    }

</script>

<svelte:window bind:scrollY={scrollY} bind:innerHeight={windowHeight} on:scroll={parseScroll} />

<section class="hero" style="opacity: {Math.max(0, 1 - scrollY / windowHeight)};">
    <div class="headline">
        <div class="text">
            <h1 class="mask"><span>{title}</span></h1>
            <hr>
            <p class="mask"><span>{desc}</span></p>
        </div>
        <figure class="sphere">
            <picture>
                <source media="(min-width: 768px)" srcset={imageLg}>
                <img src={imageSm} alt={title} />
            </picture>
        </figure>
    </div>
    <figure class="background-image">
        <picture>
            <source media="(min-width: 768px)" srcset={imageLg}>
            <img src={imageSm} alt={title} />
        </picture>
    </figure>
</section>

<style lang="scss">
    @use "src/scss/animations.scss";

    .hero {
        align-items: center;
        background-position: center center;
        background-size: cover;
        box-sizing: border-box;
        display: grid;
        grid-gap: #{fn.rem(5)};
        grid-template-columns: auto clamp(#{fn.rem(310)}, 11rem + 28vw, #{fn.rem(2560)}) auto;
        grid-template-rows: 1fr auto;
        justify-content: center;
        left: 0;
        min-height: 100vh;
        padding: var(--core-padding) 0;
        position: fixed;
        top: 0;
        width: 100%;

        &::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            bottom: 0;
            background-color: #000;
            opacity: 0.3;
        }

        :global(+ section) {
            margin-top: 100vh;
        }
    }

    .headline {
        position: relative;
        aspect-ratio: 1;
        align-self: center;
        grid-column: 2;
    }

    .text {
        animation: fadein 1s var(--easing) forwards;
        opacity: 0;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 2;
        text-align: center;
        padding: #{fn.rem(15)};
        color: #fff;

        h1 {
            font-family: var(--serif);
            font-weight: 700;
            font-size: fn.rfs(42, 120, 500, 2560);
            line-height: 1;
            margin: 0;

            span {
                animation: to-top 1s var(--easing) forwards;
            }
        }

        hr {
            animation: scale 0.8s 0.3s var(--easing) forwards;
            width: 33%;
            transform: scaleX(0);
            transform-origin: top left;
            margin: #{fn.rem(20)} 0;
            border-color: #fff;
        }

        p {
            font-size: #{fn.rfs(14, 20, 500, 2560)};
            margin: 0;

            span {
                animation: to-top 1s 0.8s var(--easing) forwards;
            }
        }
    }

    .sphere {
        animation: fadein 1s var(--easing) forwards;
        opacity: 0;
        display: block;
        background-size: cover;
        background-position: center center;
        padding-bottom: 100%;
        border-radius: 50%;
        will-change: opacity;
        opacity: 0;
        position: relative;
        z-index: 1;
        margin: 0;
        overflow: hidden;
        // box-shadow: 0 15px 40px rgba(0,0,0,0.6);

        img {
            height: 100%;
            left: 0;
            object-fit: cover;
            position: absolute;
            top: 0;
            width: 100%;
        }
    }

    .background-image {
        animation: fadein 3s var(--easing) forwards;
        opacity: 0;
        margin: 0;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 0;

        img {
            height: 100%;
            left: 0;
            object-fit: cover;
            position: absolute;
            top: 0;
            width: 100%;
        }
    }
</style>