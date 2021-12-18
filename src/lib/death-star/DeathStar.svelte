<script lang="ts">
    import { scheme } from '../../stores.js';
    import deathStarIcon from './death-star.svg?raw';

    let i = 0;
    let colorSchemes= [
        "dark",
        "light",
        "highcontrast",
        "blue",
    ];

    function handleDeathStarClick() {
        const activeScheme = colorSchemes.find(element => element == localStorage.scheme);
        const activeSchemeIndex = colorSchemes.indexOf(activeScheme) + 1;

        i = activeSchemeIndex < colorSchemes.length ? colorSchemes.indexOf(activeScheme) + 1 : 0;

        scheme.update(() => colorSchemes[i]);
    }
</script>

<button class="death-star" title="Farbschema wechseln" on:click={handleDeathStarClick}>
    {@html deathStarIcon}
</button>

<style lang="scss">
    button {
        display: flex;
    }
</style>
