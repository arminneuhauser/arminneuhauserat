<script>
    import { spring } from 'svelte/motion';

    let baseSize = 6

    let coords = spring({ x: -baseSize, y: -baseSize }, {
        stiffness: 0.3,
        damping: 1
    });

    let size = spring(baseSize);

    function isTouchDevice() {
        return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
    }

    function handleMouseMove(e) {
        return isTouchDevice() ? "" : coords.set({ x: e.clientX, y: e.clientY })
    }

    function handleMouseDown(e) {
        if (isTouchDevice()) {
            return
        } else if (e.target.tagName.toLowerCase() === "a" || e.target.tagName.toLowerCase() === "button") {
            size.set(baseSize * 4)
        } else {
            size.set(baseSize * 1.5)
        }
    }

    function handleMouseUp(e) {
        if (isTouchDevice()) {
            return
        } else if (e.target.tagName.toLowerCase() === "a" || e.target.tagName.toLowerCase() === "button") {
            size.set(baseSize * 3)
        } else {
            size.set(baseSize)
        }
    }

    function handleMouseOver(e) {
        if (isTouchDevice()) {
            return
        } else if (e.target.tagName.toLowerCase() === "a" || e.target.tagName.toLowerCase() === "button") {
            size.set(baseSize * 3)
        } else {
            size.set(baseSize)
        }
    }

</script>

<svelte:window
    on:pointermove={handleMouseMove}
    on:pointerdown={handleMouseDown}
    on:pointerup={handleMouseUp}
    on:pointerover={handleMouseOver}
/>

<svg>
    <circle cx={$coords.x} cy={$coords.y} r={Math.max(0, $size)} fill="currentColor"/>
</svg>

<style lang="scss">
    svg {
        position: fixed;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 20;
        mix-blend-mode: exclusion;
        display: none;

        @media (pointer: fine) and (prefers-reduced-motion: no-preference) {
            display: block;
        }
    }
    circle {
        color: #fff;
    }
</style>
