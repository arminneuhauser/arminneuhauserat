<script>
    import '../../scss/app.scss';
    import { onMount, afterUpdate } from 'svelte';
    import { scheme } from '../../stores.js';
    import Header from '$lib/header/Header.svelte';
    import Footer from '$lib/footer/Footer.svelte';
    import PageTransition from "$lib/page-transition/PageTransition.svelte"
    import CursorCreep from '$lib/cursor-creep/CursorCreep.svelte';
    import Scene from '$lib/scene/Scene.svelte';

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

<div>
    <Header />

        <main>
            <PageTransition refresh={key}>
                <slot />
            </PageTransition>
        </main>
        
    <Footer />
    <CursorCreep />

    <Scene />
</div>
