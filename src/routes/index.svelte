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
    <h1>
        <span>Ich erschaffe</span>
        <span>digitale</span>
        <span>Erlebnisse.</span>
    </h1>
</section>

<Scene />

<style lang="scss">
    .hero {
        height: 100vh;
        display: grid;
        align-items: center;

        h1 {
            grid-column: 1 / span 4;
            font-size: 13vw;
            line-height: 0.85;
            font-style: italic;
            font-weight: 800;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;

            span {
                display: block;

                &:first-child {
                    margin-left: 20vw;
                }

                &:nth-child(2) {
                    margin-left: -1.3vw;
                    color: transparent;
                    -webkit-text-stroke: #{fn.rem(1)} var(--on-base);
                }

                &:last-child {
                    margin-left: 15vw;
                }
            }
        }
    }
</style>
