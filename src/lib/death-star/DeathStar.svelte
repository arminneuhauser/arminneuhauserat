<script lang="ts">
    import { scheme } from '../../stores.js';
    import deathStarIcon from './death-star.svg?raw';

    let i = 0;
    let colorSchemes= [
        "dark",
        "light",
        "blue",
        "lime",
    ];

    function handleDeathStarClick() {
        i = ++i%colorSchemes.length;

        scheme.update(() => colorSchemes[i]);
    }
</script>

<button id="death-star" title="Farbschema wechseln" on:click={handleDeathStarClick}>
    <span class="sr-only">Farbschema wechseln</span>
    {@html deathStarIcon}
</button>
