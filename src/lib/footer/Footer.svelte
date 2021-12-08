<footer>
    <div>
        <h1>Lass uns gemeinsam Großes machen</h1>
        <p>
            Jede Ausfahrt sollte mit einem guten Kaffee abgeschlossen werden.<br> Also komm vorbei und sag Hallo.
        </p>
        <a href="mailto:mail@arminneuhauser.at">mail@arminneuhauser.at</a>
    </div>
    <button>Zurück nach oben</button>
</footer>

<style lang="scss">
    footer {
        display: grid;
        grid-gap: #{fn.rem(16)};
        align-items: flex-end;
        background-color: var(--base);
        padding: #{fn.rem(10)} var(--core-padding);

        @media (min-width: var.$breakpoint-md) {
            padding-top: #{fn.rem(30)};
            padding-bottom: #{fn.rem(30)};
            grid-template-columns: 1fr auto;
        }

        h1 {
            font-family: "serif";
            font-weight: 400;
            font-size: fn.rfs(24, 36);
            line-height: 1.1;
        }

        p {
            opacity: 0.7;
        }

        a {
            font-size: fn.rfs(18, 24);
            margin: 0 #{fn.rem(-10)};
            padding: #{fn.rem(10)};
            text-decoration: underline;
            
            &:hover {
                color: var(--primary);
            }
        }

        button {
            text-align: right;
        }
    }
</style>
