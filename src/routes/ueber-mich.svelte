<script context="module">
    // since there's no dynamic data here, we can prerender
    // it so that it gets served as a static asset in prod
    export const prerender = true;
</script>

<script lang="ts">
    import external from '$lib/projects/external.svg?raw';

    let now = new Date();
    let year = now.getFullYear();
    let since = year - 2009;
</script>

<svelte:head>
    <title>Über mich | Armin Neuhauser</title>
</svelte:head>

<section class="hero">
    <div>
        <h1>Hallo, ich bin Armin.</h1>
        <figure>
            <img src="/images/armin-panama-city.jpg" alt="Armin in Panama City" loading="lazy" width="860" height="1147" />
            <figcaption>Panama City, 2019</figcaption>
        </figure>
        <div>
            <p class="intro">
                Seit mittlerweile fast {since} Jahren gestalte und entwickle ich Websites, Apps & Online-Shops.
            </p>
            <p>
                Meine Karriere als Webdesigner und Entwickler begann während meines Studiums an der FH St. Pölten. Dort kam ich zum ersten Mal mit HTML, CSS, JavaScript und allem was sonst noch dazugehört in Berührung. Nach dem Studium begann ich in einer E-Commerce-Agentur verschiedene Online-Shops umzusetzen. Ich lebe in Wien und arbeite hauptberuflich für den <a href="https://www.derstandard.at/" target="_blank">Standard <i>{@html external}</i></a> als UX Engineer. Bis heute arbeite ich auch an persönlichen Projekten und gelegentlich an Kundenarbeiten, die ich auf dieser Website präsentiere.
            </p>
            <p>
                Wenn ich nicht arbeite, probiere ich gerne neue Restaurants aus und erkunde die Umgebung von Wien mit dem Fahrrad. Ich liebe es zu <a sveltekit:prefetch href="/projekte/solmates">reisen</a>. Neue Orte und Menschen kennenzulernen, gehört für mich einfach zum Leben dazu.
            </p>
            <p>
                Wenn du Interesse an einer Zusammenarbeit hast, <a sveltekit:prefetch href="/kontakt">kontaktiere mich hier</a>.
            </p>
        </div>
    </div>
</section>

<section class="services">
    <div>
        <div>
            <h2>Was ich für dich tun kann</h2>
            <ul>
                <li>UI/UX Design</li>
                <li>Webentwicklung</li>
                <li>Fotografie</li>
                <li>Branding</li>
            </ul>
        </div>
        <div>
            <h2>Meine Werkzeuge</h2>
            <ul>
                <li>Svelte</li>
                <li>Vue.js</li>
                <li>Storyblok</li>
                <li>Netlify</li>
            </ul>
        </div>
    </div>
</section>

<style lang="scss">
    section {
        box-sizing: border-box;
        padding: #{fn.rem(50)} var(--core-padding);

        > div {
            margin: 0 auto;
            max-width: var(--core-max-width);
        }
    }

    .hero {
        padding-top: #{fn.rem(180)};

        > div {
            display: grid;

            > figure {
                margin: 0;
                max-width: #{fn.rem(375)};
                display: flex;
                flex-direction: column;

                figcaption {
                    font-size: #{fn.rem(14)};
                    opacity: 0.85;
                    border-bottom: 1px solid var(--on-base);
                    padding: 0.5em 0;
                }
            }

            @media (min-width: var.$breakpoint-md) {
                grid-template-columns: 1fr 0.5fr;
                grid-column-gap: #{fn.rem(30)};

                > div {
                    grid-column: 1;
                }

                > figure {
                    grid-column: 2;
                    grid-row: 1 / span 2;
                }
            }

            @media (min-width: var.$breakpoint-lg) {
                grid-template-columns: 1fr 1fr;
            }
        }
    }

    .services {
        padding-bottom: #{fn.rem(150)};

        > div {
            display: grid;

            @media (min-width: var.$breakpoint-md) {
                grid-template-columns: 1fr 1fr;
            }
        }
    }

    h1 {
        font-family: var(--serif);
        font-weight: 700;
        font-size: #{fn.rfs(38, 75)};
        line-height: 1;
        margin: 0 0 0.5em 0;
    }

    h2 {
        font-size: #{fn.rem(20)};
        font-weight: 400;
    }

    ul {
        list-style: none;
        padding: 0;
        font-size: #{fn.rem(32)};
    }

    p {
        font-size: #{fn.rem(20)};
        max-width: #{fn.rem(620)};
    }

    .intro {
        font-size: #{fn.rem(24)};
        line-height: 1.25;
    }

    a {
        text-decoration: underline;
        text-decoration-thickness: from-font;
        text-underline-offset: 0.2em;
        transition: color 0.2s var(--easing);
        display: inline-flex;
        align-items: center;
        gap: 0.1em;

        &:hover {
            color: var(--primary);
        }
    }

    i {
        display: inline-flex;
        align-items: center;

        :global(svg) {
            width: 0.85em;
            height: 0.85em;
        }
    }
</style>
