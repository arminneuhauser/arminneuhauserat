<script>
    import { flip } from "svelte/animate";
    import { fly, fade } from "svelte/transition";
    import { notifications } from './notifications.js';

    // https://github.com/argyleink/gui-challenges/tree/main/toast
</script>

<section class="toast-group">
    {#each $notifications as notification (notification.id)}
        <output
            class="toast"
            role="status"
            aria-live="polite"
            animate:flip={{ duration: 300 }}
            in:fly={{ y: 30, duration: 300 }}
            out:fade={{ duration: 200 }}
        >
            {notification.message}
        </output>
    {/each}
</section>

<style lang="scss">
    .toast-group {
        position: fixed;
        z-index: 1;
        inset-block-end: 0;
        inset-inline: 0;
        padding-block-end: 5vh;
        display: grid;
        justify-items: center;
        justify-content: center;
        gap: 1vh;
        pointer-events: none;
    }

    .toast {
        --travel-distance: 5vh;

        color: #050505;
        background: hsl(0 0% 94% / 90%);
        max-inline-size: min(25ch, 90vw);
        padding-block: 0.5ch;
        padding-inline: 1ch;
        border-radius: 3px;
        font-size: #{fn.rem(14)};
        font-weight: 400;
        will-change: transform;
        /* animation: fade-in 0.3s ease, slide-in 0.3s ease; */
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
    }

    @keyframes slide-in {
        from {
            transform: translateY(var(--travel-distance, 10px));
        }
    }
</style>
