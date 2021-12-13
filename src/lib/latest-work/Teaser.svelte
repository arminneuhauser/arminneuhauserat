<script>
    export let scroll;
    export let title;
    export let year;
    export let backgroundImage;
    export let previewImage;
</script>

<article class="teaser">
    <div class="inner">
        <h1>
            {title}
            <span>{year}</span>
        </h1>
        <figure>
            <img src={previewImage} alt={title} />
        </figure>
        <!-- <div class="background" style="background-image: url({backgroundImage}); transform: translate(0, {scroll / 100}%) scale({1 + scroll / 100});"></div> -->
    </div>
</article>

<style lang="scss">
    .teaser {
        background-color: var(--base);
        position: relative;
        margin-top: -100vh;

        &::after {
            content: '';
            display: block;
            height: 100vh;
            width: 100%;
            pointer-events: none;
            position: relative;
        }
        &:last-of-type::after {
            display: none;
            // background: var(--base);
        }
    }

    .inner {
        background-size: cover;
        background-position: center center;
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

    figure {
        display: block;
        margin: 0;
        height: 100%;
        width: 100%;
        position: relative;
    }

    img {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    h1 {
        font-family: var(--serif);
        font-size: #{fn.rfs(36, 70)};
        margin: 0.25em 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.25em;

        span {
            font-family: var(--sans-serif);
            font-weight: 400;
            font-size: #{fn.rfs(15, 18)};
        }
    }

    // .background {
    //     background-size: cover;
    //     background-position: center center;
    //     position: absolute;
    //     top: 0;
    //     left: 0;
    //     bottom: 0;
    //     right: 0;
    //     z-index: -1;
    //     pointer-events: none;
    // }
</style>