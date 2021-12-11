
<script>
    import { fade } from 'svelte/transition';
    import { scheme } from '../stores.js';
    import Header from '$lib/header/Header.svelte';
    import Footer from '$lib/footer/Footer.svelte';
    import Progress from '$lib/progress/Progress.svelte';
    import { onMount, afterUpdate } from 'svelte';
    import '../scss/app.scss';

    var mounted = false;
    let fontsReady = false;

    let scheme_value;


	scheme.subscribe(value => {
		scheme_value = value;
	});

    onMount(() => {
        console.log("layout mounted");
        mounted = true;

        document.fonts.ready
        .then(() => {
            console.log("fonts ready");
            fontsReady = true;
        })
        .catch(() => {
            console.error("fonts can't be loaded");
        });

        // set initial height of app to prevent webkit 100vh magic
        // recalculate when width changes however
        let width = window.innerWidth;

        const setAppHeight = () => {
            const doc = document.documentElement
            doc.style.setProperty('--app-height', `${window.innerHeight}px`)
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth != width || window.innerWidth > 768) {
                width = window.innerWidth;
                setAppHeight();
            }
        });

        setAppHeight();
    });

    $: afterUpdate(() => {
        document.documentElement.setAttribute("color-scheme", scheme_value);
    });
</script>

<svelte:window
    on:sveltekit:navigation-start={() => {
        console.log('Navigation started!');
    }}
    on:sveltekit:navigation-end={() => {
        console.log('Navigation ended!');
    }}
/>

{#if fontsReady}
    <div in:fade={{ duration: 500, delay: 50 }}>
        <Header />

        <main>
            <slot />
        </main>
        
        <Footer />
    </div>
{:else}
    <div out:fade={{ duration: 250, delay: 50 }}>
        <Progress />
    </div>
{/if}
