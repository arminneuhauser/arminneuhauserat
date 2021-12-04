<script lang="ts">
    import Header from '$lib/header/Header.svelte';
    import '../scss/app.scss';
</script>

<Header />

<main>
    <slot />
</main>

<style lang="scss">
    main {
        padding-top: #{rem(80)};
    }
</style>
