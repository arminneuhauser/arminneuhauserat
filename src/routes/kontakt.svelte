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
    <div>
        <a class="mail" href="mailto:mail@arminneuhauser.at"><span>mail<span class="flickr">@</span>arminneuhauser.at</span></a>
    </div>
</section>

<section>
    <div>
        <p>
            Ich bin immer auf der Suche nach neuen Ideen und spannenden Projekten.
        </p>
        <form>
            <div>
                <label for="name">Name</label>
                <input id="name" type="text" placeholder="Ihr Name">
            </div>
            <div>
                <label for="email">E-Mail-Adresse</label>
                <input id="email" type="email" placeholder="Ihre E-Mail-Adresse">
            </div>
            <div>
                <label for="message">Nachricht</label>
                <textarea id="message" placeholder="Ihre Nachricht an mich" rows="5"></textarea>
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

    section {
        box-sizing: border-box;
        padding: var(--core-padding);

        > div {
            display: grid;
            grid-gap: var(--core-padding);
            justify-content: center;
            margin: 0 auto;
            max-width: var(--core-max-width);
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

    form {
        > div {
            margin-bottom: #{fn.rem(30)};
        }
    }

    .mail {
        // text-decoration: underline;
        font-size: #{fn.rem(24)};
        font-weight: 500;
        
        span {
            position: relative;
            z-index: 1;
            text-shadow: 0 0 0.033em #fff, 0 0 0.08em #fff, 0 0 0.1em var(--primary), 0 0 0.2em var(--primary), 0 0 0.3em var(--primary), 0 0 1em var(--primary), 0 0 1.5em var(--primary);
        }
    }

    .flickr {
        animation: flickr 3s linear infinite alternate forwards;
    }

    @keyframes flickr {
        0%,
        19.999%,
        22%,
        62.999%,
        64%,
        64.999%,
        72%,
        100% {
            opacity: 1;
        }
        20%,
        21.999%,
        63%,
        63.999%,
        65%,
        71.999% {
            opacity: 0.3;
        }
    }
</style>
