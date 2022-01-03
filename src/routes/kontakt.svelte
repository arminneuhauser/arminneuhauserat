<script lang="ts">
    let shift = -10;

    setInterval(() => {
        if (shift < -75) {
            shift = 0
        }
        shift -= 0.015
    }, 10)
</script>

<svelte:head>
    <title>Armin Neuhauser | Kontakt</title>
</svelte:head>

<section>
    <div>
        <h1 class="headline">
            <span style="transform: translate({shift}%,0)">
                <span>
                    <em>Kontakt</em> Kontakt
                    <em>Kontakt</em> Kontakt
                    <em>Kontakt</em> Kontakt
                    <em>Kontakt</em> Kontakt
                </span>
            </span>
        </h1>
    </div>
</section>

<style lang="scss">
    section {
        align-items: center;
        display: grid;
        grid-template-columns: 1fr;
        min-height: 100vh;
    }

    h1 {
        font-size: #{fn.rfs(56, 250, 360, 2560)};
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        width: 100vw;
        margin: 0;
        text-transform: uppercase;

        span {
            display: inline-block;

            span {
                display: flex;
                gap: 0.25em;
                align-items: baseline;
                transition: transform 0.5s var(--easing);
            }
        }

        em {
            font-family: var(--serif);
            font-style: normal;
            font-weight: 700;
        }
    }
</style>
