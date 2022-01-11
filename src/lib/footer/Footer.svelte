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
        <a href="mailto:mail@arminneuhauser.at" class="mail">mail@arminneuhauser.at</a>
        <hr>
        <div>
            <div class="legal">
                <a sveltekit:prefetch href="/impressum">Impressum & Datenschutz</a>
                <span>Armin Neuhauser © {year}</span>
            </div>
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
        position: relative;

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

            :global([color-scheme="highcontrast"]) & {
                opacity: 1;
            }
        }

        .mail {
            font-size: fn.rfs(18, 24);
            margin: 0 #{fn.rem(-10)};
            padding: #{fn.rem(10)};
            text-decoration: underline;
            text-underline-offset: 0.2em;
            transition: color 0.2s var(--easing);
            
            &:hover {
                color: var(--primary);
            }
        }

        .legal {
            font-size: #{fn.rem(13)};
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.15em;

            @media (min-width: var.$breakpoint-md) {
                font-size: #{fn.rem(14)};
            }

            > * {
                opacity: 0.5;

                :global([color-scheme="highcontrast"]) & {
                    opacity: 1;
                }
            }



            a {
                text-decoration: underline;
                transition: opacity 0.2s var(--easing);

                &:hover {
                    opacity: 0.6;
                }
            }
        }

        button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: #{fn.rem(10)};
            margin-right: #{fn.rem(-10)};
            transition: color 0.2s var(--easing);

            &:hover {
                color: var(--primary);
            }
        }

        hr {
            margin: #{fn.rem(40)} 0 #{fn.rem(20)};
        }
    }
</style>
