<script lang="ts">
    import { fly } from "svelte/transition";
    export let refresh = "";
</script>

{#key refresh}
    <!-- <div in:fade={{duration: 500, delay: 300}} out:fade={{duration: 500, delay: 300}}> -->
    <div
        in:fly={{ y: 70, duration: 500, delay: 500 }}
        out:fly={{ y: 70, duration: 500 }}
    >
        <slot />
    </div>
{/key}
