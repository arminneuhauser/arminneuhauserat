<script context="module" lang="ts">
    // since there's no dynamic data here, we can prerender
	// it so that it gets served as a static asset in prod
    export const prerender = true;
</script>

<script lang="ts">
    import Scene from '$lib/scene/Scene.svelte';
</script>

<svelte:head>
    <title>Armin Neuhauser | Webdesign</title>
</svelte:head>

<Scene />

<section class="grid pt-16 md:pt-20 lg:pt-24">
    <div class="col-start-4 col-end-5">
        <h3 class="font-extrabold mb-4">
            Hallo, ich bin Armin
        </h3>
        <h1 class="font-serif">
            Ich erschaffe digitale<br class="hidden lg:block">
            Erlebnisse, jeden Tag<span class="text-primary">.</span>
        </h1>
    </div>
    <div class="col-start-4 col-end-6">
        <!-- <img class="mt-20" src="/cartagena.jpg" alt="Cartagena"> -->
    </div>
</section>

<style lang="scss">
    section {
        grid-template-columns: var(--site-core-padding) auto fn.rem(12) 1fr var(--site-core-padding);

        h3 {
            font-size: fn.rfs(18, 24);
            margin-top: 1.7em;
        }

        h1 {
            font-size: fn.rfs(48, 80);
            line-height: 1.2;
        }
    }
</style>
