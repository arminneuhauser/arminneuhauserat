<script context="module" lang="ts">
    export const prerender = true;
</script>

<script lang="ts">
    import Scene from '$lib/scene/Scene.svelte';
</script>

<svelte:head>
    <title>Armin Neuhauser | Webdesign</title>
</svelte:head>

<section class="hero">
    <div>
        <h1>
            <span>I make</span>
            <span>Creative</span>
            <span>Things,</span>
            <span>Everyday.</span>
        </h1>
    </div>
</section>

<!-- <section class="hero">
    <h1>
        <span>Ich erschaffe</span>
        <span>digitale</span>
        <span>Erlebnisse.</span>
    </h1>
</section> -->

<Scene />

<style lang="scss">
    .hero {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--site-core-padding);

        > div {
            position: relative;
            flex: 1 1 auto;
            max-width: fn.rfs(240, 320);

            &::after {
                content: "";
                display: block;
                padding-bottom: 100%;
                background-color: hsla(0deg, 0%, 100%, 0.5);
                border: 1px solid hsla(0deg, 0%, 100%, 0.6);
                border-radius: 50%;
                mix-blend-mode: soft-light;
            }
        }

        h1 {
            font-family: "serif";
            font-weight: 400;
            font-size: fn.rfs(24, 32);
            line-height: 1.1;
            // text-transform: uppercase;
            // letter-spacing: 0.025em;
            text-align: center;
            margin: 0;
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            z-index: 1;

            span {
                display: block;
            }
        }
    }

    // .hero {
    //     height: 100vh;
    //     display: grid;
    //     align-items: center;

    //     h1 {
    //         font-family: "title";
    //         grid-column: 1 / span 4;
    //         font-size: 13vw;
    //         line-height: 0.85;
    //         font-style: italic;
    //         font-weight: 800;
    //         margin: 0;
    //         white-space: nowrap;
    //         overflow: hidden;
    //         // mix-blend-mode: overlay;

    //         span {
    //             display: block;

    //             &:first-child {
    //                 margin-left: 20vw;
    //             }

    //             &:nth-child(2) {
    //                 margin-left: -1.3vw;
    //                 color: transparent;
    //                 -webkit-text-stroke: #{fn.rem(1)} var(--on-base);
    //             }

    //             &:last-child {
    //                 margin-left: 15vw;
    //             }
    //         }
    //     }
    // }
</style>
