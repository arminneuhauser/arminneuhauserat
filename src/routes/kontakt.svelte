<script context="module">
    // since there's no dynamic data here, we can prerender
    // it so that it gets served as a static asset in prod
    export const prerender = true;
</script>

<svelte:head>
    <title>Armin Neuhauser | Kontakt</title>
</svelte:head>

<section>
    <div>
        <h1>Kontakt</h1>
    </div>
</section>

<style lang="scss">
    section {
        align-items: center;
        display: grid;
        grid-gap: 0;
        grid-template-columns: auto minmax(min-content, #{fn.rem(960)}) auto;
        justify-content: center;
        min-height: 100vh;
        padding: #{fn.rem(72)} var(--core-padding);
        max-width: var(--core-max-width);
        margin: 0 auto;
    }
    h1 {
        font-family: var(--serif);
        font-size: #{fn.rfs(32, 110)};
        line-height: 1;
        margin: 0.5em 0;
    }
</style>
