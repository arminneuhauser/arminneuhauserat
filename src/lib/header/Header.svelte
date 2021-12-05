<script lang="ts">
    import { page } from '$app/stores';
    import menu from './menu.svg?raw';
    import theme from './theme.svg?raw';

    let now = new Date(),
        year = now.getFullYear();
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
            <a sveltekit:prefetch href="/ueber-mich" class:active={$page.path === '/ueber-mich'}>Über mich</a>
        </div>
    </div>
    <div>
        <a sveltekit:prefetch href="/kontakt" class:active={$page.path === '/kontakt'}>Kontakt</a>
    </div>
    <div class="last">
        <span>©{year}</span>
        <button class="death-star" title="Licht an">
            <span class="sr-only">Licht an</span>
            {@html theme}
        </button>
    </div>

    <button class="maki-mix" title="Menü anzeigen">
        <span class="sr-only">Menü anzeigen</span>
        {@html menu}
    </button>

    <nav class="mobile-nav">
        <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>Start</a>
        <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>Projekte</a>
        <a sveltekit:prefetch href="/ueber-mich" class:active={$page.path === '/ueber-mich'}>Über mich</a>
        <a sveltekit:prefetch href="/kontakt" class:active={$page.path === '/kontakt'}>Kontakt</a>
        <button class="death-star" title="Licht an">
            <span class="sr-only">Licht an</span>
            {@html theme}
        </button>
    </nav>
</header>

<style lang="scss">
    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: #{fn.rem(20)} var(--site-core-padding);
        text-transform: uppercase;
        font-size: #{fn.rem(13)};
        text-align: left;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        mix-blend-mode: difference;
        z-index: 1;

        @media (max-width: var.$breakpoint-md-max) {
            > div:not(.logo) {
                display: none;
            }
        }

        @media (min-width: var.$breakpoint-md) {
            display: grid;
            grid-column-gap: #{fn.rem(20)};
            grid-template-columns: repeat(4, 1fr);
            padding-top: #{fn.rem(40)};
            padding-bottom: #{fn.rem(40)};
            align-items: flex-start;
        }
    }

    .logo {
        font-weight: 500;
    }

    .last {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .maki-mix {
        height: #{fn.rem(24)};
        width: #{fn.rem(24)};
        display: flex;
        align-items: center;
        justify-content: center;

        @media (min-width: var.$breakpoint-md) {
            display: none;
        }
    }

    .mobile-nav {
        display: none;
    }
</style>
