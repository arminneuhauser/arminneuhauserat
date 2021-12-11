<script>
    import { page } from '$app/stores';
    import { onMount, beforeUpdate } from 'svelte';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';

    let progress = tweened(0, {
        duration: 2500,
        easing: cubicOut
    });

    progress.set(0.7);

    onMount(() => {
        console.log("onmount progress");
        progress.set(1);
    });
</script>

<div class="progress">
    <div>
        <div class="number">
            {Math.ceil($progress * 100)}%
        </div>
        <div class="path">
            loading {$page.path}
        </div>
    </div>
    
    <div class="progress-bar">
        <div class="progress-sliver" style={`--width: ${$progress * 100}%`} />
    </div>
</div>

<style lang="scss">
    @use "src/scss/animations.scss";

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
    }
    .path {
        // animation: blink-animation 1.5s var(--easing) infinite;
    }
    .progress-bar {        
        height: #{fn.rem(1)};
        background-color: rgba(255,255,255,0.1);
    }
    .progress-sliver {
        width: var(--width);
        background-color: rgba(255,255,255,0.5);
        height: 100%;
    }
</style>
