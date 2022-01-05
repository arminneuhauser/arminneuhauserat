<script context="module">
    // since there's no dynamic data here, we can prerender
    // it so that it gets served as a static asset in prod
    export const prerender = true;
</script>

<script lang="ts">
    let now = new Date();
    let year = now.getFullYear();
    let since = year - 2009;
</script>

<svelte:head>
    <title>Über mich | Armin Neuhauser</title>
</svelte:head>

<section>
    <div>
        <h1>Hallo, ich bin Armin.</h1>
        <img src="images/armin-panama-city.jpeg" alt="Armin in Panama City" loading="lazy"/>
        <div>
            <p>Seit mittlerweile fast {since} Jahren gestalte und entwickle ich Websites & Online-Shops.</p>
            <p>Mit einer Kombination aus Erfahrungen in Design und Development kann ich verschiedenste Problemstellungen lösen und Projekte ganzheitlich betreuen und steuern. Es begeistert mich, zusammen mit dir von Grund auf die Persönlichkeit deiner Marke zu definieren, zu gestalten und unverwechselbar zu machen. Ich erarbeite aus deinen Ideen digitale und analoge Kreationen für deinen Erfolg.</p>
        </div>
    </div>
</section>

<style lang="scss">
    section {
        box-sizing: border-box;
        padding: #{fn.rem(150)} var(--core-padding);

        > div {
            margin: 0 auto;
            max-width: var(--core-max-width);
            display: grid;

            @media (min-width: var.$breakpoint-md) {
                grid-template-columns: 1fr 0.5fr;

                > div {
                    grid-column: 1;
                }

                > img {
                    grid-column: 2;
                    grid-row: 1 / span 2;
                }
            }
        }
    }

    h1 {
        font-family: var(--serif);
        font-weight: 700;
        font-size: #{fn.rfs(38, 75)};
        line-height: 1;
        margin: 0.5em 0;
    }

    p {
        font-size: #{fn.rem(20)};
        max-width: #{fn.rem(620)};
    }
</style>
