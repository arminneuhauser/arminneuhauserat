<script lang="ts">
    import { page } from '$app/stores';
    import logo from './logo.svg';
    import lightbulb from './lightbulb.svg?raw';
    import menu from './menu.svg?raw';
    import avatar from './armin-neuhauser-photo.jpg';
</script>

<header class="fixed w-full px-4 md:px-8 lg:px-12">
    <div class="flex-1 flex justify-between border-b py-4">
        <a sveltekit:prefetch href="/" class="flex gap-3">
            <img class="rounded-full h-12 w-12" src={avatar} alt="Armin Neuhauser Foto" />
            <img src={logo} alt="Armin Neuhauser Logo" />
        </a>

        <button title="Menü anzeigen" class="md:hidden">
            {@html menu}
        </button>

        <nav class="hidden md:flex items-center md-max:hidden">
            <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>Projekte</a>
            <a sveltekit:prefetch href="/about" class:active={$page.path === '/about'}>Über mich</a>
            <a sveltekit:prefetch href="/todos" class:active={$page.path === '/todos'}>Kontakt</a>
            <button title="Licht aus" class="ml-4">
                {@html lightbulb}
                <span class="sr-only">Licht aus</span>
            </button>
        </nav>
    </div>
</header>

<style lang="scss">
    nav {
        a {
            @apply px-4;
        }
    }
</style>
