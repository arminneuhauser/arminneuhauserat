<script lang="ts">
    import { fly } from "svelte/transition";
    export let refresh = "";
</script>

{#key refresh}
    <!-- <div in:fade={{duration: 500, delay: 300}} out:fade={{duration: 500, delay: 300}}> -->
    <!-- <div
        in:fly|local={{ y: 70, duration: 500, delay: 500 }}
        out:fly|local={{ y: 70, duration: 500 }}
        on:introstart="{() => console.log('intro started')}"
        on:outrostart="{() => console.log('outro started')}"
        on:introend="{() => console.log('intro ended')}"
        on:outroend="{() => console.log('outro ended')}"
    > -->
    <div
        in:fly|local={{ y: 70, duration: 500, delay: 500 }}
        out:fly|local={{ y: 70, duration: 500 }}
    >
        <slot />
    </div>
{/key}
