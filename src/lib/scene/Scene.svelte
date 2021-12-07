<script>
    import '@mszu/pixi-ssr-shim';

    import { Application } from '@pixi/app';
    import { Graphics } from '@pixi/graphics';
    import { BLEND_MODES } from '@pixi/constants';
    import { BatchRenderer, Renderer } from '@pixi/core';
    import { InteractionManager } from '@pixi/interaction';
    import { TickerPlugin } from '@pixi/ticker';
    import { KawaseBlurFilter } from '@pixi/filter-kawase-blur';
    import { NoiseFilter } from '@pixi/filter-noise';
    import { ColorMatrixFilter } from '@pixi/filter-color-matrix';
    import SimplexNoise from 'simplex-noise';
    import hsl from 'hsl-to-hex';
    import debounce from 'debounce';
    import { onMount } from 'svelte';

    // This initialization needs to only happen once, even when the component
    // is unmounted and re-mounted
    if (!(Renderer.__plugins ?? {}).hasOwnProperty('interaction')) {
        Renderer.registerPlugin('interaction', InteractionManager);
    }
    if (!(Renderer.__plugins ?? {}).hasOwnProperty('batch')) {
        Renderer.registerPlugin('batch', BatchRenderer);
    }
    if (!(Application._plugins || []).some((plugin) => plugin === TickerPlugin)) {
    	Application.registerPlugin(TickerPlugin);
    }

    // return a random number within a range
    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // map a number from 1 range to another
    function map(n, start1, end1, start2, end2) {
        return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
    }

    // set blur radius based on window size
    function setBlur() {
        let blurRadius = 13 + window.innerHeight * window.innerWidth / 80000;
        return blurRadius;
    }

    let view;
    let app;
    let renderer;

    onMount(async () => {

        // Create PixiJS app
        app = new Application({
            view,
            resizeTo: window,
            backgroundAlpha: 0,
        });

        renderer = new Renderer();

        let blurFilter = new KawaseBlurFilter(setBlur(), 10, true);

        let noiseFilter = new NoiseFilter(0.18, random(0, 0.05));
        // noiseFilter.blendMode = BLEND_MODES.COLOR_BURN;

        let colorMatrix = new ColorMatrixFilter();
        colorMatrix.technicolor(true);
        colorMatrix.brightness(0.25, true);

        app.stage.filters = [
            blurFilter,
            noiseFilter,
            colorMatrix,
        ];

        // Create a new simplex noise instance
        const simplex = new SimplexNoise();

        // ColorPalette class
        class ColorPalette {
            constructor() {
                this.setColors();
                this.setCustomProperties();
            }

            setColors() {
                // pick a random hue somewhere between 220 and 360
                this.hue = ~~random(195, 215); // blue
                this.complimentaryHue = ~~random(0, 20); // orange
                // define a fixed saturation and lightness
                this.saturation = 100;
                this.lightness = 50;

                // define a base color
                this.baseColor = hsl(this.hue, this.saturation, this.lightness);
                // define a complimentary color, 30 degress away from the base
                this.complimentaryColor = hsl(this.complimentaryHue, this.saturation, this.lightness);

                // store the color choices in an array so that a random one can be picked later
                this.colorChoices = [
                    this.baseColor,
                    this.complimentaryColor
                ];
            }

            randomColor() {
                // pick a random color
                return this.colorChoices[~~random(0, this.colorChoices.length)].replace(
                    "#",
                    "0x"
                );
            }

            setCustomProperties() {
                // set CSS custom properties so that the colors defined here can be used throughout the UI
                document.documentElement.style.setProperty("--hue", this.hue.toString());
                document.documentElement.style.setProperty("--hue-complimentary", this.complimentaryHue.toString());
            }
        }

        // Orb class
        class Orb {
            constructor(fill = 0x000000) {
                // bounds = the area an orb is "allowed" to move within
                this.bounds = this.setBounds();
                // initialise the orb's { x, y } values to a random point within it's bounds
                this.x = random(this.bounds['x'].min, this.bounds['x'].max);
                this.y = random(this.bounds['y'].min, this.bounds['y'].max);

                // how large the orb is vs it's original radius (this will modulate over time)
                this.scale = 1;

                // what color is the orb?
                this.fill = fill;

                // the original radius of the orb, set relative to window height
                // this.radius = random(window.innerHeight / 6, window.innerHeight / 20);

                this.radius = this.setRadius();

                // starting points in "time" for the noise/self similar random values
                this.xOff = random(0, 1000);
                this.yOff = random(0, 1000);
                // how quickly the noise/self similar random values step through time
                this.inc = 0.00008;

                // PIXI.Graphics is used to draw 2d primitives (in this case a circle) to the canvas
                this.graphics = new Graphics();
                this.graphics.alpha = 0.75;

                this.graphics.blendMode = BLEND_MODES.SCREEN;

                // 250ms after the last window resize event, recalculate orb positions.
                let lastWidth = window.innerWidth;
                window.addEventListener(
                    'resize',
                    debounce(() => {
                        let diffWidth =  window.innerWidth - lastWidth;

                        lastWidth = window.innerWidth;

                        if (diffWidth > 0) {
                            this.bounds = this.setBounds();
                            this.radius = this.setRadius();
                            blurFilter.blur = setBlur();
                        }
                    }, 250)
                );
            }

            setRadius() {
                const windowSize = (window.innerWidth * window.innerHeight);
                const radius = random(30 + windowSize / 12000, 100 + windowSize / 12000);

                return this.radius = radius;
            }

            setBounds() {
                // how far from the { x, y } origin can each orb move
                const maxDistX = window.innerWidth / 1.5;
                const maxDistY = window.innerHeight / 2.5;

                // the { x, y } origin for each orb (the bottom right of the screen)
                const originX = window.innerWidth / 2;
                const originY = window.innerHeight / 1.85;

                // allow each orb to move x distance away from it's { x, y }origin
                return {
                    x: {
                        min: originX - maxDistX,
                        max: originX + maxDistX
                    },
                    y: {
                        min: originY - maxDistY,
                        max: originY + maxDistY
                    }
                };
            }

            update() {
                // self similar "psuedo-random" or noise values at a given point in "time"
                const mouseX = renderer.plugins.interaction.mouse.global.x;
                const mouseY = renderer.plugins.interaction.mouse.global.y;
                const xNoise = simplex.noise2D(this.xOff, this.xOff);
                const yNoise = simplex.noise2D(this.yOff, this.yOff);
                const scaleNoise = simplex.noise2D(this.xOff, this.yOff);

                // map the xNoise/yNoise values (between -1 and 1) to a point within the orb's bounds
                this.x = map(xNoise, -1, 1, this.bounds["x"].min, this.bounds["x"].max);
                this.y = map(yNoise, -1, 1, this.bounds["y"].min, this.bounds["y"].max);

                // this.x = this.x + mouseX*0.0001;

                // map scaleNoise (between -1 and 1) to a scale value somewhere between half of the orb's original size, and 100% of it's original size
                this.scale = map(scaleNoise, -1, 1, 0.5, 1);

                // step through "time"
                this.xOff += this.inc;
                this.yOff += this.inc;
            }

            render() {
                // update the PIXI.Graphics position and scale values
                this.graphics.x = this.x;
                this.graphics.y = this.y;
                this.graphics.scale.set(this.scale);

                // clear anything currently drawn to graphics
                this.graphics.clear();

                // tell graphics to fill any shapes drawn after this with the orb's fill color
                this.graphics.beginFill(this.fill);
                // draw a circle at { 0, 0 } with it's size set by this.radius
                this.graphics.drawCircle(0, 0, this.radius);
                // let graphics know we won't be filling in any more shapes
                this.graphics.endFill();
            }
        }

        // Create colour palette
        const colorPalette = new ColorPalette();

        // Create orbs
        const orbs = [];

        for (let i = 0; i < 50; i++) {
            const orb = new Orb(colorPalette.randomColor());

            app.stage.addChild(orb.graphics);

            orbs.push(orb);
        }

        // Animate!
        app.stage.interactive = true;

        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            app.ticker.add(() => {
                noiseFilter.seed = random(0, 0.05);

                orbs.forEach((orb) => {
                    orb.update();
                    orb.render();
                });
            });
        } else {
            orbs.forEach((orb) => {
                orb.update();
                orb.render();
            });
        }
    });
</script>

<canvas bind:this={view}></canvas>

<style lang="scss">
    canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    }

    :global([color-scheme="light"]) {
        canvas {
            opacity: 0.25;
            mix-blend-mode: luminosity;
        }
    }

    :global([color-scheme="blue"]) {
        canvas {
            mix-blend-mode: screen;
        }
    }

    :global([color-scheme="lime"]) {
        canvas {
            mix-blend-mode: screen;
        }
    }
</style>
