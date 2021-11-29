<script lang="ts">
    import Header from '$lib/header/Header.svelte';
    import '../app.scss';
</script>

<Header />

<main>
    <slot />
</main>

<style lang="scss">
    main {
        padding-top: #{fn.rem(80)};
    }
</style>
