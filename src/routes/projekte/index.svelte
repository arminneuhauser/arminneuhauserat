<svelte:head>
    <title>Armin Neuhauser | Projekte</title>
</svelte:head>

<section>
    <div>
        <h1>Projekte</h1>
        <div class="projects">
            <div>
                <a sveltekit:prefetch href="/projekte/mst-muhr" title="Projekt MST Muhr ansehen">
                    MST Muhr
                </a>
            </div>
            <div>
                <a sveltekit:prefetch href="/projekte/solmates" title="Projekt Solmates ansehen">
                    Solmates
                </a>
            </div>
            <div>
                <a sveltekit:prefetch href="/projekte/wohnformat" title="Projekt [wohnformat] ansehen">
                    [wohnformat]
                </a>
            </div>
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
        }
    }
    h1 {
        font-family: var(--serif);
        font-weight: 700;
        font-size: #{fn.rfs(32, 110)};
        line-height: 1;
        margin: 0.5em 0;
    }
</style>
