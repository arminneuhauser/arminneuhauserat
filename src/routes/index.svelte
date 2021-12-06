<script context="module" lang="ts">
    export const prerender = true;
</script>

<script lang="ts">
    import Scene from '$lib/scene/Scene.svelte';
    import deathStar from '$lib/death-star.svg?raw';

    let i = 0;
    let colorSchemes= ['dark', 'light'];

    function handleDeathStarClick() {
		i = ++i%colorSchemes.length; 
        document.documentElement.setAttribute("color-scheme", colorSchemes[i]);
	}
</script>

<svelte:head>
    <title>Armin Neuhauser | Webdesign</title>
</svelte:head>

<section class="hero">
    <div class="sphere">
        <h1>
            <span>Ich erschaffe</span>
            <span>ausgereifte digitale</span>
            <span>Erlebnisse im Web,</span>
            <span>jeden Tag.</span>
            <!-- Meine Projekte sind wie guter Espresso: Stark, belebend und nicht verwässert. -->
            <!-- <span>I make</span>
            <span>Creative</span>
            <span>Things,</span>
            <span>Everyday.</span> -->
        </h1>
    </div>
    <div class="bottom">
        <div>
            <h2>Konzept, Design & Entwicklung</h2>
            <h3>made in Vienna</h3>
        </div>
        <button id="death-star" title="Licht an" on:click={handleDeathStarClick}>
            <span class="sr-only">Licht an</span>
            {@html deathStar}
        </button>
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
        box-sizing: border-box;
        min-height: var(--app-height, 100vh);
        // min-height: -webkit-fill-available;
        // display: flex;
        // flex-wrap: wrap;
        // align-items: center;
        // align-content: center;
        // justify-content: center;
        padding: var(--core-padding);
        display: grid;
        grid-template-rows: 1fr auto;
        grid-gap: #{fn.rem(16)};
        grid-template-columns: auto minmax(auto, #{fn.rem(480)}) auto;

        .sphere {
            position: relative;
            // flex: 1 0 100%;
            // max-width: fn.rfs(240, 320);
            // max-width: #{fn.rem(600)};
            aspect-ratio: 1;
            align-self: center;
            grid-column: 2;

            &::after {
                content: "";
                display: block;
                padding-bottom: 100%;
                background-color: hsla(0deg, 0%, 100%, 0.5);
                border: 1px solid hsla(0deg, 0%, 100%, 0.7);
                border-radius: 50%;
                mix-blend-mode: soft-light;
            }
        }

        h1 {
            font-family: "serif";
            font-weight: 400;
            font-size: fn.rfs(24, 36);
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

        .bottom {
            // flex: 1 0 100%;
            // align-self: flex-end;
            grid-column: 2;
            display: grid;
            grid-template-columns: auto 1fr auto;

            > div {
                grid-column: 2;
            }

            h2, h3 {
                font-size: fn.rem(15);
                font-weight: 400;
                margin: 0;
                text-align: center;
                color: white;
                mix-blend-mode: exclusion;
                opacity: 0.6;

                [color-scheme="light"] & {
                    mix-blend-mode: normal;
                    color: var(--on-base);
                    opacity: 1;
                }
            }

            #death-star {
                @media (min-width: var.$breakpoint-md) {
                    display: none;
                }

                :global(svg) {
                    height: #{fn.rem(22)};
                    width: #{fn.rem(22)};
                }
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
