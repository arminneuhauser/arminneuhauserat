<script context="module">
    export const prerender = true;
</script>

<script lang="ts">
    import arrow from '$lib/latest-work/arrow.svg?raw';

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

<section>
    <header>
        <p>
            Ich bin immer auf der Suche nach neuen Ideen und spannenden Projekten. Zögere nicht, mir zu schreiben.
        </p>
    </header>
    <div>
        <a class="mail" href="mailto:mail@arminneuhauser.at"><span>mail<span class="flickr">@</span>arminneuhauser.at</span></a>
    </div>
</section>

<section>
    <header>
        <h3>Lass uns dein Projekt verwirklichen</h3>
        <p>
            Ich bin immer auf der Suche nach neuen Ideen und spannenden Projekten. Fülle das Kontaktformular aus, wenn du mit mir zusammenarbeiten möchtest.
        </p>
    </header>
    <div>
        <form name="contact" method="POST" netlify>
            <div>
                <label for="name">Name</label>
                <input id="name" name="name" type="text" placeholder="Dein Name">
            </div>
            <div>
                <label for="email">E-Mail-Adresse</label>
                <input id="email" name="email" type="email" placeholder="Deine E-Mail-Adresse">
            </div>
            <div>
                <label for="message">Nachricht</label>
                <textarea id="message" name="message" placeholder="Deine Nachricht an mich" rows="5"></textarea>
            </div>
            <button type="submit">
                Absenden
                {@html arrow}
            </button>
        </form>
    </div>
</section>

<style lang="scss">
    @use "src/scss/forms.scss";
    @use "src/scss/animations.scss";

    section {
        box-sizing: border-box;
        padding: var(--core-padding);

        > div {
            margin: 0 auto;
            max-width: var(--content-max-width);
        }

        > header {
            margin: 0 auto #{fn.rem(60)};
            max-width: var(--content-max-width);
            border-left: 1px solid var(--on-base);
            padding-left: #{fn.rem(15)};
        }

        &:last-child {
            padding-bottom: calc(var(--core-padding) * 3);
        }
    }

    h1 {
        font-size: #{fn.rfs(56, 250, 360, 2560)};
        font-weight: 400;
        white-space: nowrap;
        overflow: hidden;
        width: 100vw;
        margin: #{fn.rem(120)} 0 #{fn.rem(70)};
        text-transform: uppercase;

        @media (min-width: var.$breakpoint-lg) {
            margin-top: #{fn.rem(180)};
        }

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

    h3 {
        font-size: #{fn.rfs(24, 34)};
    }

    p {
        font-size: #{fn.rfs(16, 18)};
        max-width: #{fn.rem(600)};
    }

    form {
        > div {
            margin-bottom: #{fn.rem(30)};
        }
    }

    .mail {
        font-size: #{fn.rfs(22, 50, 320, 768)};
        font-weight: 500;
        
        > span {
            position: relative;
            z-index: 1;

            &::before {
                content: '';
                position: absolute;
                left: 0;
                width: 100%;
                bottom: -0.05em;
                border-bottom: 0.1em solid var(--on-base);
                transition: transform 0.25s var(--easing);
                pointer-events: none;
            }

            :global([color-scheme="dark"]) & {
                text-shadow: 0 0 0.033em #fff, 0 0 0.08em #fff, 0 0 0.1em var(--primary), 0 0 0.2em var(--primary), 0 0 0.3em var(--primary), 0 0 1em var(--primary), 0 0 1.5em var(--primary);

                &::before {
                    box-shadow: 0 0 0.033em #fff, 0 0 0.08em #fff, 0 0 0.1em var(--primary), 0 0 0.2em var(--primary), 0 0 0.3em var(--primary), 0 0 1em var(--primary), 0 0 1.5em var(--primary);
                }

                .flickr {
                    animation: flickr 3s linear infinite alternate forwards;
                }
            }

        }

        &:hover {
            > span {
                &::before {
                    transform: translateY(0.1em);
                }
            }
        }
    }
</style>
