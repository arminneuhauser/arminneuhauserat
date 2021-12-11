<script>
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    let mounted = false;
    let progress = tweened(0);

    onMount(() => {
        mounted = true;

        progress = tweened(preProgress, {
            duration: 750,
            easing: cubicOut
        });

        progress.set(100);
    });
</script>

<svelte:head>
    <script>
        var preProgress = 0;

        setTimeout(() => {
            if (document.getElementById("preProgressNumber") && document.getElementById("preProgressNumber").innerText) {
                setInterval(() => {
                    if (document.getElementById("preProgressNumber") && document.getElementById("preProgressNumber").innerText) {
                        if (parseInt(document.getElementById("preProgressNumber").innerText) < 70) {
                            document.getElementById("preProgressNumber").innerText = parseInt(document.getElementById("preProgressNumber").innerText) + 1;
                            preProgress = parseInt(document.getElementById("preProgressNumber").innerText) + 1;
                            document.getElementById("preProgressSliver").style.setProperty('--width', `${preProgress}%`);
                        }
                    }
                }, 100);
            }
        }, 500);
    </script>
</svelte:head>

<div class="progress">
    <div>
        <div class="number">
            {#if !mounted}
                <span id="preProgressNumber">0</span>%
            {:else}
                <span id="progessNumber">{Math.ceil($progress)}</span>%
            {/if}
        </div>
        <div class="path">
            loading {$page.path}
        </div>
    </div>
    
    <div class="progress-bar">
        {#if !mounted}
            <div id="preProgressSliver" class="progress-sliver" />
        {:else}
            <div id="progressSliver" class="progress-sliver" style={`--width: ${$progress}%`} />
        {/if}
    </div>
</div>

<style lang="scss">
    .progress {
        position: fixed;
        bottom: #{fn.rem(40)};
        left: #{fn.rem(40)};
        right: #{fn.rem(40)};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";

        > div {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: baseline;
        }
    }
    .number {
        font-size: #{fn.rfs(64, 140)};

        @media (prefers-reduced-motion: reduce) {
            display: none;
        }
    }
    .progress-bar {        
        height: #{fn.rem(1)};
        background-color: rgba(255,255,255,0.1);

        @media (prefers-reduced-motion: reduce) {
            display: none !important;
        }
    }
    .progress-sliver {
        width: var(--width);
        background-color: rgba(255,255,255,0.5);
        height: 100%;
    }
</style>
