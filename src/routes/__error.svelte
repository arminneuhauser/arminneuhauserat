<script context="module">
	/** @type {import('@sveltejs/kit').ErrorLoad} */
	export function load({ error, status }) {
        console.log(error);
		return {
			props: {
				title: status,
                message: error.message.replace("Not found: ", ""),
			}
		};
	}
</script>

<script lang="ts">
	export let title;
    export let message;

    import SquiggleLink from '$lib/squiggle-link/SquiggleLink.svelte';
</script>

<svelte:head>
    <title>Armin Neuhauser | {title} Error</title>
</svelte:head>

<section>
    <div>
        <h1>{title}</h1>
        <p>Entschuldige, diese Seite wurde nicht gefunden: {message}</p>
        <p>
            <SquiggleLink href="/">Zur Startseite</SquiggleLink>
        </p>
    </div>
</section>

<style lang="scss">
    section {
        box-sizing: border-box;
        padding: #{fn.rem(150)} var(--core-padding);
    }

    div {
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

    p {
        font-size: #{fn.rem(20)};
    }

    a {
        text-decoration: underline;
    }
</style>
