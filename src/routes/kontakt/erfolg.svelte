<script context="module">
    export const prerender = true;
</script>

<script lang="ts">
    import SquiggleLink from '$lib/squiggle-link/SquiggleLink.svelte';

    let shift = -10;

    setInterval(() => {
        if (shift < -75) {
            shift = 0
        }
        shift -= 0.015
    }, 10)
</script>

<svelte:head>
    <title>Kontakt | Armin Neuhauser</title>
</svelte:head>

<section>
    <div>
        <h1>Danke für deine Nachricht!</h1>
        <p>
            Ich werde dir sobald wie möglich antworten.
        </p>
        <p>
            <SquiggleLink href="/">Zur Startseite</SquiggleLink>
        </p>
    </div>
</section>

<style lang="scss">
    @use "src/scss/animations.scss";

    section {
        box-sizing: border-box;
        padding: #{fn.rem(200)} var(--core-padding) #{fn.rem(100)};

        > div {
            margin: 0 auto;
            max-width: var(--content-max-width);
        }
    }

    h1 {
        font-size: #{fn.rfs(24, 34)};
        line-height: 1.1;
        margin: 0.75em 0;
    }

    p {
        font-size: #{fn.rfs(16, 18)};
        max-width: #{fn.rem(600)};
        margin: 0.75em 0;
    }

    a {
        text-decoration: underline;
        text-underline-offset: 0.2em;
        transition: color 0.2s var(--easing);

        &:hover {
            color: var(--primary);
        }
    }
</style>
