<script context="module">
    // since there's no dynamic data here, we can prerender
    // it so that it gets served as a static asset in prod
    export const prerender = true;
</script>

<svelte:head>
    <title>Armin Neuhauser | Über mich</title>
</svelte:head>

<section class="intro">
    <div>
        <h3>Über mich</h3>
        <h1>Hallo, ich bin Armin,</h1>
        <p>ein österreichischer Grafik-Designer und Webentwickler.</p>
        <p>Mit einer Kombination aus Erfahrungen in Design und Development kann ich verschiedenste Problemstellungen lösen und Projekte ganzheitlich betreuen und steuern. Es begeistert mich, zusammen mit dir von Grund auf die Persönlichkeit deiner Marke zu definieren, zu gestalten und unverwechselbar zu machen. Ich erarbeite aus deinen Ideen digitale und analoge Kreationen für deinen Erfolg.</p>
    </div>
</section>

<style lang="scss">
    .intro {
        align-items: center;
        display: grid;
        grid-gap: 0;
        grid-template-columns: auto minmax(min-content, #{fn.rem(960)}) auto;
        justify-content: center;
        min-height: 100vh;
        padding: #{fn.rem(72)} var(--core-padding);
        max-width: var(--core-max-width);
        margin: 0 auto;

        div {
            grid-column: 2;
        }

        h3 {
            font-size: #{fn.rfs(16, 20)};
            font-weight: 400;
            margin: 0;
        }

        h1 {
            font-family: var(--serif);
            font-weight: 700;
            font-size: #{fn.rfs(32, 110)};
            line-height: 1;
            margin: 0.5em 0;
        }

        p {
            font-size: #{fn.rem(21)};
            max-width: #{fn.rem(620)};
        }
    }
</style>
