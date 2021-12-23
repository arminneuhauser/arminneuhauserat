<!-- https://www.delphic.top/blog/making_a_blog_website_with_sveltekit/ -->

<script context="module">
    import { browser, dev } from '$app/env'
    export const hydrate = dev
    export const router = browser

    export async function load({ page, fetch }) {
        const url = `/projekte/${page.params.slug}.json`
        const res = await fetch(url)
        if (res.ok) {
        const blog = await res.json()
        // console.log({ blog })
        return { props: { blog } }
        }
        return {
            status: res.status,
            error: new Error(`Could not load ${url}`)
        }
    }
</script>

<script>
    export let blog
</script>

<svelte:head>
    <title>Armin Neuhauser | {blog.metadata.title}</title>
    <meta name="description" content="{blog.metadata.description}" />
</svelte:head>

<section>
    <div>
        <h1>{blog.metadata.title}</h1>
        {@html blog.html}
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
