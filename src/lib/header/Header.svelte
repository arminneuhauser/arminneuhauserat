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
        <a sveltekit:prefetch href="/">Armin Neuhauser</a>
    </div>
    <div>
        <div>
            <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>Projekte</a>
        </div>
        <div>
            <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>Über mich</a>
        </div>
    </div>
    <div>
        <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>Kontakt</a>
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

        :global([color-scheme="dark"]) & {
            mix-blend-mode: exclusion;
        }

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
        }

        @media (prefers-reduced-motion: no-preference) {
            animation: fadein-from-primary 0.5s ease-out forwards;
        }

        div {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
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
