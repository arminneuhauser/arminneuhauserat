<script lang="ts">    
    export let title;
    export let desc;
    export let imageSm;

    let scrollY;
    let windowHeight;
    let opacity = 1;

    function parseScroll() {
        opacity = scrollY / windowHeight * -1 + 1 > 0 ? scrollY / windowHeight * -1 + 1 : 0;

        console.log(scrollY);
    }
</script>

<svelte:window bind:scrollY={scrollY} bind:innerHeight={windowHeight} />

<section class="hero" style="background-image: url({imageSm}); opacity: {Math.max(0, 1 - scrollY / windowHeight)};">
    <div class="circle" style="background-image: url({imageSm});">
        <div class="text">
            <h1>{title}</h1>
            <hr>
            <p>{desc}</p>
        </div>
    </div>
</section>

<style lang="scss">
    .hero {
        min-height: var(--app-height, 100vh);
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-size: cover;
        background-position: center center;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;

        &::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            bottom: 0;
            background-color: #000;
            opacity: 0.3;
        }

        .circle {
            height: #{fn.rem(320)};
            width: #{fn.rem(320)};
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--base);
            border-radius: 50%;
            background-size: cover;
            background-position: center center;
            position: relative;
            box-shadow: 0 15px 40px rgba(0,0,0,0.6);
        }

        .text {
            text-align: center;

            h1 {
                font-family: var(--serif);
                font-weight: 700;
                font-size: #{fn.rem(36)};
                line-height: 1;
                margin: 0.5em 0;
            }

            hr {
                width: 33%;
            }

            p {
                font-size: #{fn.rem(15)};
            }      
        }

        :global(+ section) {
            margin-top: var(--app-height, 100vh);
        }
    }
</style>