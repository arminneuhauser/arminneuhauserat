<script lang="ts">
    import external from '$lib/projects/external.svg?raw';

    export let href;
</script>

<a class="link" href={href} target="_blank">
    <span>Website ansehen</span>
    <i>{@html external}</i>
</a>

<style lang="scss">
    .link {
        justify-self: center;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: #{fn.rem(10)};
        margin-top: #{fn.rem(20)};
        font-size: #{fn.rfs(15, 20, $minWidth: 1280, $maxWidth: 2560)};

        i {
            border: 1px solid var(--primary);
            width: #{fn.rem(66)};
            height: #{fn.rem(66)};
            border-radius: 50%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            transform: rotate(45deg);
            transition: color 0.25s var(--easing);

            &::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: var(--primary);
                transform: scaleY(0);
                transform-origin: bottom left;
                transition: transform 0.6s var(--easing);
            }

            :global(svg) {
                position: relative;
                transform: rotate(-45deg);
            }
        }

        span {
            pointer-events: none;
        }

        &:hover {
            i {
                color: var(--on-primary);

                &::before {
                    transform: scaleY(1);
                }
            }
        }
    }
</style>