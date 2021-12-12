<script>
    export let title;
    export let year;
    export let previewImage;
</script>

<article class="teaser">
    <a href="#todo">
        <h1>
            {title}
            <span>{year}</span>
        </h1>
        <figure>
            <img src={previewImage} alt={title} />
        </figure>
    </a>
</article>

<style lang="scss">
    .teaser {
        background: var(--base);
        position: relative;
        margin-top: -100vh;

        &::after {
            content: '';
            display: block;
            height: 100vh;
            width: 100%;
        }

        // &:last-of-type::after {
        //     display: none;
        // }

        > a {
            position: relative;
            top: 0;
            height: 100vh;
            display: grid;
            grid-template-rows: auto 1fr;
            grid-template-columns: minmax(max-content, var(--core-max-width));
            align-items: center;
            justify-content: center;
            padding: #{fn.rem(80)} var(--core-padding) var(--core-padding);
            box-sizing: border-box;

            @media (prefers-reduced-motion: no-preference) {
                position: sticky;
            }
        }

        :global(figure) {
            display: block;
            margin: 0;
            height: 100%;
            width: 100%;
            position: relative;
        }

        :global(img) {
            position: absolute;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        :global(h1) {
            font-family: var(--serif);
            font-size: #{fn.rfs(36, 70)};
            margin: 0.25em 0;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: baseline;
            gap: 0.25em;
        }

        :global(h1 span) {
            font-family: var(--sans-serif);
            font-weight: 400;
            font-size: #{fn.rfs(15, 18)};
        }
    }
</style>