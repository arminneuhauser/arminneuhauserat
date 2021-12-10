<script lang="ts">
    import { page } from '$app/stores';
    import DeathStar from '$lib/death-star/DeathStar.svelte';
    import makiMix from './maki-mix.svg?raw';

    let now = new Date(),
        year = now.getFullYear();

    let mobileMenuVisible = false

    function handleMakiMixClick() {
        mobileMenuVisible = !mobileMenuVisible;
    }
</script>

<header>
    <div class="logo" >
        <a sveltekit:prefetch href="/">
            <i>A</i><i>r</i><i>m</i><i>i</i><i>n</i> <i>N</i><i>e</i><i>u</i><i>h</i><i>a</i><i>u</i><i>s</i><i>e</i><i>r</i>
        </a>
    </div>
    <div>
        <div>
            <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>
                <i>P</i><i>r</i><i>o</i><i>j</i><i>e</i><i>k</i><i>t</i><i>e</i>
            </a>
        </div>
        <div>
            <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>
                <i>Ü</i><i>b</i><i>e</i><i>r</i> <i>m</i><i>i</i><i>c</i><i>h</i>
            </a>
        </div>
    </div>
    <div>
        <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>
            <i>K<i>o</i><i>n</i><i>t</i><i>a</i><i>k</i><i>t</i>
        </a>
    </div>
    <div class="last">
        <span>©{year}</span>
        <DeathStar/>
    </div>

    <button class="maki-mix" class:active="{mobileMenuVisible}" title="{mobileMenuVisible?'Menü ausblenden':'Menü anzeigen'}" on:click={handleMakiMixClick}>
        {@html makiMix}
    </button>
</header>

<nav class="mobile-nav" class:active="{mobileMenuVisible}">
    <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>Start</a>
    <a sveltekit:prefetch href="/">Projekte</a>
    <a sveltekit:prefetch href="/">Über mich</a>
    <a sveltekit:prefetch href="/">Kontakt</a>
</nav>

<style lang="scss">
    @use "src/scss/animations.scss";

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: #{fn.rem(10)} var(--core-padding);
        text-transform: uppercase;
        font-size: #{fn.rfs(13, 16, $minWidth: 1280, $maxWidth: 2560)};
        text-align: left;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        color: var(--on-base);
        z-index: 10;
        pointer-events: none;

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

        @media (prefers-reduced-motion: no-preference) {
            animation: fadein-from-primary 0.5s var(--easing) forwards;
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

    .logo {
        font-weight: 500;
        margin-left: #{fn.rem(-10)};
    }

    .last {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        margin-right: #{fn.rem(-10)};

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

        @media (min-width: var.$breakpoint-md) {
            padding-top: 0.25em;
            padding-bottom: 0.25em;
        }
    }

    a {
        transition: all 0.2s var(--easing);

        i {
            display: inline-block;
            font-style: normal;
        }

        &:hover {
            i {
                animation: flip-and-back 0.5s var(--easing) 0.02s;

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
        margin-right: #{fn.rem(-10)};

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
        padding: #{fn.rem(100)} var(--core-padding);
        display: flex;
        flex-direction: column;
        justify-content: center;

        @media (max-width: var.$breakpoint-sm-max) {
            &.active {
                opacity: 1;
                pointer-events: all;
            }
        }

        @media (min-width: var.$breakpoint-md) {
            display: none;
        }

        a {
            display: flex;
            align-items: flex-end;
            font-size: #{fn.rem(32)};
            width: 100%;
            text-transform: uppercase;
        }
    }
</style>
