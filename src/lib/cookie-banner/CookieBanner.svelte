<script lang="ts">
    import { cookieConsent } from '../../stores.js';
    import { onMount } from 'svelte';

    let mounted = false;

    function handleCookieClick() {
        cookieConsent.update(() => "true");
    }

    onMount(() => {
        mounted = true;
    });
</script>

{#if mounted}
    <div class="cookies">
        <div>
            <p>Diese Website nutzt Cookies.</p>
            <button on:click={handleCookieClick}>OK</button>
        </div>
    </div>
{/if}

<style lang="scss">
    .cookies {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        text-align: center;
        padding: var(--core-padding);
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        pointer-events: none;
        z-index: 15;

        > div {
            background: var(--base);
            border: 1px solid hsla(var(--on-base-h), var(--on-base-s), var(--on-base-l), 0.1);
            border-radius: #{fn.rem(10)};
            padding: #{fn.rem(15)} #{fn.rem(20)} #{fn.rem(10)};
            pointer-events: auto;
            display: flex;
            flex-direction: column;

            @media (min-width: var.$breakpoint-lg) {
                flex-direction: row;
                align-items: center;
                padding: #{fn.rem(10)} #{fn.rem(35)};
            }
        }

        p {
            font-size: #{fn.rfs(13, 16)};
            margin: 0;
        }

        button {
            font-size: #{fn.rem(15)};
            font-weight: 500;
            color: var(--primary);
            padding: #{fn.rem(5)} #{fn.rem(10)};
            transition: color 0.2s var(--easing);

            @media (min-width: var.$breakpoint-lg) {
                font-size: #{fn.rfs(13, 16)};
            }

            &:hover {
                color: var(--on-base);
            }
        }
    }
</style>