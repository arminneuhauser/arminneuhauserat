<script lang="ts">
    export let href;
    export let target = undefined;
</script>

{#if target === "_blank"}
    <a class="squiggle-link" href={href} target="_blank">
        <slot />
    </a>
{:else}
    <a sveltekit:prefetch class="squiggle-link" href={href}>
        <slot />
    </a>
{/if}

<style lang="scss">
    @use "src/scss/animations.scss";

    .squiggle-link {
        --bg: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:ev='http://www.w3.org/2001/xml-events' viewBox='0 0 20 4'%3E%3Cstyle type='text/css'%3E.squiggle{animation:shift .3s linear infinite;}@keyframes shift {from {transform:translateX(0);}to {transform:translateX(-20px);}}%3C/style%3E%3Cpath fill='none' stroke='%23ffffff' stroke-width='1' class='squiggle' d='M0,3.5 c 5,0,5,-3,10,-3 s 5,3,10,3 c 5,0,5,-3,10,-3 s 5,3,10,3'/%3E%3C/svg%3E");

        :global([color-scheme="light"]) & {
            --bg: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:ev='http://www.w3.org/2001/xml-events' viewBox='0 0 20 4'%3E%3Cstyle type='text/css'%3E.squiggle{animation:shift .3s linear infinite;}@keyframes shift {from {transform:translateX(0);}to {transform:translateX(-20px);}}%3C/style%3E%3Cpath fill='none' stroke='%23050505' stroke-width='1' class='squiggle' d='M0,3.5 c 5,0,5,-3,10,-3 s 5,3,10,3 c 5,0,5,-3,10,-3 s 5,3,10,3'/%3E%3C/svg%3E");
        }

        :global([color-scheme="highcontrast"]) & {
            --bg: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:ev='http://www.w3.org/2001/xml-events' viewBox='0 0 20 4'%3E%3Cstyle type='text/css'%3E.squiggle{animation:shift .3s linear infinite;}@keyframes shift {from {transform:translateX(0);}to {transform:translateX(-20px);}}%3C/style%3E%3Cpath fill='none' stroke='%23001F9A' stroke-width='1' class='squiggle' d='M0,3.5 c 5,0,5,-3,10,-3 s 5,3,10,3 c 5,0,5,-3,10,-3 s 5,3,10,3'/%3E%3C/svg%3E");
        }

        display: inline-flex;
        align-items: center;
        gap: 0.1em;

        :global(i) {
            transition: transform 0.2s var(--easing);
        }

        &:hover :global(i) {
            transform: translate(2px, -2px);
        }

        &:has(span) {
            :global(span) {
                text-decoration: underline;
                text-decoration-thickness: from-font;
                text-underline-offset: 0.2em;
            }

            &:hover {
                :global(span) {
                    background-image: var(--bg);
                    background-position: 0 100%;
                    background-size: auto 3px;
                    background-repeat: repeat-x;
                    text-decoration: none;
                }
            }
        }

        &:not(:has(span)) {
            text-decoration: underline;
            text-decoration-thickness: from-font;
            text-underline-offset: 0.2em;

            &:hover {
                background-image: var(--bg);
                background-position: 0 100%;
                background-size: auto 3px;
                background-repeat: repeat-x;
                text-decoration: none;
            }
        }
    }
</style>
