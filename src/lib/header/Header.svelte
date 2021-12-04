<script lang="ts">
    import { page } from '$app/stores';
    import menu from './menu.svg?raw';

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
        <button title="Licht an">
            <span class="sr-only">Licht an</span>
        </button>
    </div>

    <!-- <button title="Menü anzeigen" class="md:hidden">
        {@html menu}
    </button> -->
</header>

<style lang="scss">
    header {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-column-gap: #{fn.rem(20)};
        padding: #{fn.rem(40)} var(--site-core-padding);
        text-transform: uppercase;
        font-size: #{fn.rem(14)};
        text-align: left;
    }

    .logo {
        font-weight: 700;
    }

    .last {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }
</style>
