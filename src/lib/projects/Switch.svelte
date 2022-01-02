<script lang="ts">
    export let label1;
    export let label2;
    export let checked;
</script>

<label class="switch">
    <span class="switch--label">{label1}</span>
    <input class="switch--input" type="checkbox" bind:checked={checked} />
    <span class="switch--trigger wrapper"></span>
    <span class="switch--label">{label2}</span>
</label>


<style lang="scss">
    .switch {
        position: relative;
        display: flex;
        gap: #{fn.rem(15)};
        flex-direction: row;
        align-items: center;
        user-select: none;
        cursor: pointer;

        &--label {
            color: var(--on-base);
            user-select: none;
        }

        &--input {
            position: absolute;
            opacity: 0;
            display: none;
            width: 0;
            height: 0;
            top: -100rem;
            left: -100rem;
        }

        &--trigger {
            position: relative;
            height: 1.8rem;
            width: 4rem;
            border-radius: 5rem;
            transition: all 0.3s var(--easing);
            background-color: var(--base);;
            border: 1px solid var(--on-base);

            &::after {
                content: "";
                position: absolute;
                height: 1.3rem;
                width: 1.3rem;
                background: var(--on-base);
                left: 0.9rem;
                top: 50%;
                transform: translate(-50%, -50%);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                border-radius: 100%;
            }
        }
    }

    .switch input:checked ~ .switch--trigger {
        background-color: var(--on-base);

        &::after {
            background: var(--base);
            left: calc(100% - 0.9rem);
        }
    }
</style>
