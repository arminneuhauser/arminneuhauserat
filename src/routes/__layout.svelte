<script>
    import '../scss/app.scss';
    import { onMount, afterUpdate } from 'svelte';
    import { scheme, cookieConsent } from '../stores.js';
    import Header from '$lib/header/Header.svelte';
    import Footer from '$lib/footer/Footer.svelte';
    import CursorCreep from '$lib/cursor-creep/CursorCreep.svelte';
    import CookieBanner from '$lib/cookie-banner/CookieBanner.svelte';
    import Scene from '$lib/scene/Scene.svelte';
    import PageTransition from "$lib/page-transition/PageTransition.svelte"
    import { page } from '$app/stores';
    import { GoogleAnalytics } from '@beyonk/svelte-google-analytics'
   
    export let key;

    let scheme_value;


	scheme.subscribe(value => {
		scheme_value = value;
	});

    onMount(async () => {
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

<div>
    <Header />
    
    <PageTransition refresh={key}>
        <main>
            <slot />
        </main>
    </PageTransition>

    <Footer />

    <CursorCreep />

    {#if $cookieConsent !== "true"}
        <CookieBanner />
    {/if}

    <Scene />

    <GoogleAnalytics properties={[ 'gG-71C50F0RNV' ]} />
</div>
