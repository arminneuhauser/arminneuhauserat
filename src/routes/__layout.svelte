<script>
    // import { page } from '$app/stores';
    import { fade } from 'svelte/transition';
    import { onMount, afterUpdate, beforeUpdate } from 'svelte';
    import { scheme } from '../stores.js';
    import Header from '$lib/header/Header.svelte';
    import Footer from '$lib/footer/Footer.svelte';
    import Progress from '$lib/progress/Progress.svelte';
    import PageTransition from "$lib/page-transition/PageTransition.svelte"
    import CursorCreep from '$lib/cursor-creep/CursorCreep.svelte';
    import '../scss/app.scss';

    export let key;

    let fontsReady = false;
    let scheme_value;

	scheme.subscribe(value => {
		scheme_value = value;
	});

    onMount(async () => {
        document.fonts.ready
        .then(async () => {
            setTimeout(() => {
                fontsReady = true;
            }, 500);
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

        console.log("for the nerds:")
    });

    $: afterUpdate(() => {
        document.documentElement.setAttribute("color-scheme", scheme_value);
    });
</script>

<script context="module">
    export const load = async ({ page }) => ({
        props: {
            key: page.path,
        },
    })
</script>

<svelte:window
    on:sveltekit:navigation-start={() => {
        // console.log('Navigation started!');
    }}
    on:sveltekit:navigation-end={() => {
        // console.log('Navigation ended!');
    }}
/>

{#if fontsReady}
    <!-- <div in:fade={{ duration: 300, delay: 50 }}> -->
    <div>
        <Header />

            <main>
                <PageTransition refresh={key}>
                    <slot />
                </PageTransition>
            </main>
            
        <Footer />
        <CursorCreep />
    </div>
{:else}
    <div out:fade={{ duration: 250 }}>
        <Progress />
    </div>
{/if}
