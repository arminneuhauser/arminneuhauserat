<svelte:head>
    <title>Armin Neuhauser | Projekte</title>
</svelte:head>

<section>
    <div>
        <h1>Projekte</h1>
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
        font-weight: 700;
        font-size: #{fn.rfs(32, 110)};
        line-height: 1;
        margin: 0.5em 0;
    }
</style>
