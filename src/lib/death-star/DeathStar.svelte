<script lang="ts">
    import { scheme } from '../../stores.js';
    import deathStarIcon from './death-star.svg?raw';
    import { notifications } from '$lib/toast/notifications.js';

    let i = 0;
    let colorSchemes= [
        {
            "name": "dark",
            "description": "Dark"
        },
        {
            "name": "light",
            "description": "Light"
        },
        {
            "name": "highcontrast",
            "description": "High Contrast"
        },
    ];

    function handleDeathStarClick() {
        const activeScheme = colorSchemes.find(element => element.name == localStorage.scheme);
        const activeSchemeIndex = colorSchemes.indexOf(activeScheme) + 1;

        i = activeSchemeIndex < colorSchemes.length ? colorSchemes.indexOf(activeScheme) + 1 : 0;

        scheme.update(() => colorSchemes[i].name);

        notifications.send(colorSchemes[i].description + ' Mode aktiviert', 3000);
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
