<script lang="ts">
    import { page } from '$app/stores';
    import DeathStar from '$lib/death-star/DeathStar.svelte';
    import makiMix from './maki-mix.svg?raw';
    import { browser } from '$app/env'

    let now = new Date(),
        year = now.getFullYear();

    let mobileMenuVisible = false

    function handleMakiMixClick() {
        mobileMenuVisible = !mobileMenuVisible;
    }

    function scrollToTop() {
        window.scrollTo(0,0);
    }

    function handleMobileClick() {
        mobileMenuVisible = false;
        scrollToTop();
    }

    // set noscroll class to body when mobile menu is open
    $: if (browser) document.body.classList.toggle('noscroll', mobileMenuVisible);

</script>

<svelte:window
    on:sveltekit:navigation-start={() => {
        mobileMenuVisible = false;
    }}
/>

<header role="banner">
    <section>
        <h1 class="logo" role="heading" aria-label="Armin Neuhauser">
            <a sveltekit:prefetch href="/" aria-label="Startseite" class:active={$page.path === '/'} on:click={handleMobileClick}>
                <i aria-hidden="true">A</i><i aria-hidden="true">r</i><i aria-hidden="true">m</i><i aria-hidden="true">i</i><i aria-hidden="true">n</i> <i aria-hidden="true">N</i><i aria-hidden="true">e</i><i aria-hidden="true">u</i><i aria-hidden="true">h</i><i aria-hidden="true">a</i><i aria-hidden="true">u</i><i aria-hidden="true">s</i><i aria-hidden="true">e</i><i aria-hidden="true">r</i>
            </a>
        </h1>
        <div>
            <div>
                <a sveltekit:prefetch href="/projekte" aria-label="Projekte" class:active={$page.path === '/projekte'} on:click={scrollToTop}>
                    <i aria-hidden="true">P</i><i aria-hidden="true">r</i><i aria-hidden="true">o</i><i aria-hidden="true">j</i><i aria-hidden="true">e</i><i aria-hidden="true">k</i><i aria-hidden="true">t</i><i aria-hidden="true">e</i>
                </a>
            </div>
            <div>
                <a sveltekit:prefetch href="/ueber-mich" aria-label="Über mich" class:active={$page.path === '/ueber-mich'} on:click={scrollToTop}>
                    <i aria-hidden="true">Ü</i><i aria-hidden="true">b</i><i aria-hidden="true">e</i><i aria-hidden="true">r</i> <i aria-hidden="true">m</i><i aria-hidden="true">i</i><i aria-hidden="true">c</i><i aria-hidden="true">h</i>
                </a>
            </div>
        </div>
        <div>
            <a sveltekit:prefetch href="/kontakt" aria-label="Kontakt" class:active={$page.path === '/kontakt'} on:click={scrollToTop}>
                <i aria-hidden="true">K</i><i aria-hidden="true">o</i><i aria-hidden="true">n</i><i aria-hidden="true">t</i><i aria-hidden="true">a</i><i aria-hidden="true">k</i><i aria-hidden="true">t</i>
            </a>
        </div>
        <div class="last">
            <span>©{year}</span>
            <DeathStar/>
        </div>
        <button 
            class="maki-mix" 
            class:active="{mobileMenuVisible}" 
            aria-expanded="{mobileMenuVisible?true:false}" 
            aria-haspopup="menu" 
            title="{mobileMenuVisible?'Menü ausblenden':'Menü anzeigen'}" 
            on:click={handleMakiMixClick}>
            <div aria-hidden="true">
                {@html makiMix}
            </div>
        </button>
    </section>
</header>

<div class="mobile-nav" class:active="{mobileMenuVisible}" inert={!mobileMenuVisible || null}>
    <nav aria-label="Mobiles Navigationsmenü" role="menu">
        <div class="main">
            <a sveltekit:prefetch href="/" role="menuitem" aria-label="Start" class:active={$page.path === '/'} on:click={handleMobileClick}>
                <span aria-hidden="true">Start</span>
            </a>
            <a sveltekit:prefetch href="/projekte" role="menuitem" aria-label="Projekte" class:active={$page.path === '/projekte'} on:click={handleMobileClick}>
                <span aria-hidden="true">Projekte</span>
            </a>
            <a sveltekit:prefetch href="/ueber-mich" role="menuitem" aria-label="Über mich" class:active={$page.path === '/ueber-mich'} on:click={handleMobileClick}>
                <span aria-hidden="true">Über mich</span>
            </a>
            <a sveltekit:prefetch href="/kontakt" role="menuitem" aria-label="Kontakt" class:active={$page.path === '/kontakt'} on:click={handleMobileClick}>
                <span aria-hidden="true">Kontakt</span>
            </a>
        </div>
        <div class="footer">
            <h1><span>Sag Hallo</span></h1>
            <a href="mailto:mail@arminneuhauser.at" role="menuitem" aria-label="Schreib mir eine E-Mail an mail@arminneuhauser.at"><span>mail@arminneuhauser.at</span></a>
        </div>
    </nav>
</div>

<style lang="scss">
    @use "src/scss/animations.scss";

    header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10;
        pointer-events: none;
        // mix-blend-mode: exclusion;

        @media (prefers-reduced-motion: no-preference) {
            animation: fadein-from-primary 1s var(--easing) forwards;
        }

        > section {
            align-items: center;
            color: var(--header-color, var(--on-base));
            display: flex;
            font-size: #{fn.rfs(13, 16, $minWidth: 1280, $maxWidth: 2560)};
            justify-content: space-between;
            padding: #{fn.rem(10)} var(--core-padding);
            text-align: left;
            text-transform: uppercase;

            @media (max-width: var.$breakpoint-sm-max) {
                > div:not(.logo) {
                    display: none;
                }
            }

            @media (min-width: var.$breakpoint-md) {
                display: grid;
                grid-column-gap: #{fn.rem(20)};
                grid-template-columns: repeat(4, 1fr);
                padding-top: #{fn.rem(30)};
                padding-bottom: #{fn.rem(30)};
                align-items: flex-start;
                max-width: var(--core-max-width);
                margin: 0 auto;
            }
            
            > * {
                pointer-events: auto;
            }

            div {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }

            :global([color-scheme="dark"]) & {
                color: var(--on-base);

                &::before {
                    content: '';
                    background: linear-gradient(
                        0deg,
                        hsla(var(--base-h), var(--base-s), var(--base-l), 0),
                        hsla(var(--base-h), var(--base-s), var(--base-l), 0.2) 70%,
                        hsla(var(--base-h), var(--base-s), var(--base-l), 0.9)
                        );
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: #{fn.rem(200)};
                    z-index: -1;
                    pointer-events: none !important;
                }
            }
        }
    }

    .logo {
        font-size: inherit;
        font-weight: 500;
        margin: 0 0 0 #{fn.rem(-10)};
    }

    .last {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        margin-right: #{fn.rem(-6)};

        // death star
        :global(button) {
            padding: 0.25em;
            transition: color 0.2s var(--easing);

            &:hover {
                color: var(--primary);
            }
        }

        :global(svg) {
            height: 1.85em;
            width: 1.85em;
        }
    }

    a, span {
        padding: #{fn.rem(10)};
        box-sizing: border-box;

        @media (min-width: var.$breakpoint-md) {
            padding-top: 0.25em;
            padding-bottom: 0.25em;
        }

        :global([color-scheme="highcontrast"]) & {
            font-weight: 500;
        }
    }

    a {
        transition: all 0.2s var(--easing);

        i {
            display: inline-block;
            font-style: normal;
            pointer-events: none;
        }

        &:hover {
            i {
                @media (prefers-reduced-motion: no-preference) {
                    animation: flip-and-back 0.5s 0.02s var(--easing);
                }

                &:nth-child(2) {
                    animation-delay: 0.04s;
                }
                &:nth-child(3) {
                    animation-delay: 0.06s;
                }
                &:nth-child(4) {
                    animation-delay: 0.08s;
                }
                &:nth-child(5) {
                    animation-delay: 0.1s;
                }
                &:nth-child(6) {
                    animation-delay: 0.12s;
                }
                &:nth-child(7) {
                    animation-delay: 0.14s;
                }
                &:nth-child(8) {
                    animation-delay: 0.16s;
                }
                &:nth-child(9) {
                    animation-delay: 0.18s;
                }
                &:nth-child(10) {
                    animation-delay: 0.2s;
                }
                &:nth-child(11) {
                    animation-delay: 0.22s;
                }
                &:nth-child(12) {
                    animation-delay: 0.24s;
                }
                &:nth-child(13) {
                    animation-delay: 0.26s;
                }
                &:nth-child(14) {
                    animation-delay: 0.28s;
                }
            }
        }
    }

    .maki-mix {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: #{fn.rem(10)};
        margin-right: #{fn.rem(-15)};

        &.active {
            :global(.yummy) {
                display: none;
            }
        }

        @media (min-width: var.$breakpoint-md) {
            display: none;
        }
    }

    .mobile-nav {
        box-sizing: border-box;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        overflow: hidden;
        overflow-y: auto;
        background-color: var(--base);
        opacity: 0;
        pointer-events: none;
        transition: opacity .4s cubic-bezier(0.7,0,0.3,1);
        z-index: 9;
        height: 100vh;

        @media (max-width: var.$breakpoint-sm-max) {
            &.active {
                opacity: 1;
                pointer-events: all;

                a {
                    transform: rotateY(0deg);
                    opacity: 1;

                    span {
                        animation: to-top 0.8s 0.2s var(--easing) forwards;
                    }

                    &:nth-child(2) span {
                        animation-delay: 0.3s;
                    }
                    &:nth-child(3) span {
                        animation-delay: 0.4s;
                    }
                    &:nth-child(4) span {
                        animation-delay: 0.5s;
                    }

                    &.active {
                        text-decoration: line-through;
                    }
                }

                .footer {
                    h1 span {
                        animation: to-top 0.8s 0.7s var(--easing) forwards;
                    }

                    a span {
                        animation-delay: 1s !important;
                    }
                }
            }
        }

        @media (min-width: var.$breakpoint-md) {
            display: none;
        }

        > nav {
            height: var(--app-height);
            padding: #{fn.rem(100)} var(--core-padding) var(--core-padding);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;

            .main {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding-bottom: #{fn.rem(100)};
            }
        }

        a {
            display: flex;
            font-size: #{fn.rem(32)};
            line-height: 2;
            width: 100%;
            text-transform: uppercase;
            overflow: hidden;
            padding: 0;

            span {
                transform: translate3d(0, 100%, 0);
                padding: 0;
            }
        }

        .footer {
            margin-top: auto;

            h1, a {
                overflow: hidden;

                span {
                    display: inline-flex;
                    transform: translate3d(0, 100%, 0);
                }
            }

            h1 {
                font: var(--w1-serif);
                font-size: #{fn.rem(24)};
                margin: 0 0 #{fn.rem(10)};

                span {
                    padding: 0;
                }
            }

            a {
                font: var(--w1-sans);
                text-transform: none;
                text-decoration: underline;
                text-underline-offset: 0.2em;
            }
        }
    }
</style>
