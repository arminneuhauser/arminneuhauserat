<script lang="ts">
    import * as animateScroll from "svelte-scrollto";
    import up from './up.svg?raw';

    let now = new Date(),
        year = now.getFullYear();
</script>

<footer>
    <div>
        <h1>Lass uns gemeinsam Großes erschaffen</h1>
        <p>
            Jede Ausfahrt sollte mit einem guten Kaffee abgeschlossen werden.<br> Also komm vorbei und sag Hallo.
        </p>
        <a href="mailto:mail@arminneuhauser.at">mail@arminneuhauser.at</a>
        <hr>
        <div>
            <small>Armin Neuhauser © {year}</small>
            <button on:click={() => animateScroll.scrollToTop()} title="Zurück nach oben">
                {@html up}
            </button>
        </div>
    </div>
</footer>

<style lang="scss">
    footer {
        background-color: var(--base);
        padding: #{fn.rem(70)} var(--core-padding) var(--core-padding);

        @media (min-width: var.$breakpoint-md) {
            padding-top: #{fn.rem(30)};
            padding-bottom: #{fn.rem(30)};
        }

        > div {
            max-width: var(--core-max-width);
            margin: 0 auto;

            > div {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
        }

        h1 {
            font-family: var(--serif);
            font-weight: 700;
            font-size: fn.rfs(32, 64);
            line-height: 1.1;
        }

        p {
            opacity: 0.7;
        }

        a {
            font-size: fn.rfs(18, 24);
            margin: 0 #{fn.rem(-10)};
            padding: #{fn.rem(10)};
            text-decoration: underline;
            
            &:hover {
                color: var(--primary);
            }
        }

        small {
            opacity: 0.5;
        }

        button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: #{fn.rem(10)};
            margin-right: #{fn.rem(-10)};
        }

        hr {
            margin: #{fn.rem(40)} 0 #{fn.rem(20)};
        }
    }
</style>
