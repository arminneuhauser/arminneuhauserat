<script lang="ts">
    import { page } from '$app/stores';
    import logo from './logo.svg';
    import avatar from './armin-neuhauser-photo.jpg';
</script>

<header class="bg-white px-4 md:px-8 lg:px-12">
    <div class="flex-1 flex justify-between border-b py-4">
        <a sveltekit:prefetch href="/" class="flex gap-3">
            <img class="rounded-full h-12 w-12" src={avatar} alt="Armin Neuhauser Foto" />
            <img class="logo" src={logo} alt="Armin Neuhauser Logo" />
        </a>

        <nav class="flex items-center">
            <a sveltekit:prefetch href="/" class:active={$page.path === '/'}>Projekte</a>
            <a sveltekit:prefetch href="/about" class:active={$page.path === '/about'}>Über mich</a>
            <a sveltekit:prefetch href="/todos" class:active={$page.path === '/todos'}>Kontakt</a>
        </nav>
    </div>
</header>

<style>
    nav a {
        @apply px-4;
    }
</style>
