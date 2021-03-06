import Link from 'gatsby-link'
import React from 'react'
import SbEditable from 'storyblok-react'

import * as headerStyles from './header.module.scss'

const Nav = ({ settings }) => (
  <header className={headerStyles.header}>
    <div>
      <Link to="/" className={headerStyles.logo}>
        <svg width="140" height="34" xmlns="http://www.w3.org/2000/svg"><path d="M13.42 8.98l1.2-4.27h.11l1.2 4.27h-2.51zM6.3 15.33h5.25l.88-2.96h4.49l.88 2.96h5.25L17.47.01h-5.58L6.3 15.33zm17.73 0h4.93v-4.38h1.64l2.19 4.38h5.14l-2.96-5.47c.45-.27.86-.61 1.2-1.01.8-.94 1.23-2.14 1.2-3.37.01-3.04-2.47-5.49-5.51-5.48-.09 0-.18 0-.28.01h-7.55v15.32zm4.93-8.54V4.17h2.08a1.3 1.3 0 011.42 1.16c.01.05.01.1.01.16.01.71-.55 1.31-1.27 1.32-.05 0-.1 0-.16-.01h-2.08zm10.62 8.54h4.93V7.12l3.72 4.71 3.72-4.71v8.21h4.93V.01H52.5l-4.27 5.47L43.96.01h-4.38v15.32zm20.14 0h4.93V.01h-4.93v15.32zm7.77 0h4.93V8l5.69 7.33h4.27V.01h-4.93v7.33L71.76.01h-4.27v15.32zM.06 33.24h4.93v-7.33l5.69 7.33h4.27V17.92h-4.93v7.33l-5.69-7.33H.06v15.32zm17.73 0h12.37v-4.05h-7.44v-1.86h5.47v-3.5h-5.47v-1.86h7.22v-4.05H17.79v15.32zm14.23-6.45c0 3.94 2.93 6.9 7.22 6.9s7.22-2.96 7.22-6.9v-8.87h-4.93v8.87c.05 1.27-.93 2.34-2.2 2.39s-2.34-.93-2.39-2.2V17.92h-4.93v8.87zm17.08 6.45h4.93v-5.58h4.6v5.58h4.93V17.92h-4.93v5.36h-4.6v-5.36H49.1v15.32zm22.55-6.34l1.2-4.27h.11l1.2 4.27h-2.51zm-7.12 6.34h5.25l.88-2.96h4.49l.88 2.96h5.25L75.7 17.92h-5.58l-5.59 15.32zm17.08-6.45c0 3.94 2.93 6.9 7.22 6.9 4.29 0 7.22-2.96 7.22-6.9v-8.87h-4.93v8.87c.06 1.27-.91 2.35-2.18 2.42s-2.35-.91-2.42-2.18v-9.1h-4.93v8.86zm15.65 4.27c.49.52 1.05.96 1.66 1.31a9 9 0 004.79 1.31c3.94 0 6.35-2.41 6.35-5.04 0-4.93-6.9-4.62-6.9-6.35 0-.44.44-.77 1.31-.77.62.01 1.22.2 1.73.55.22.15.41.34.57.55l2.85-2.96c-.4-.43-.87-.8-1.38-1.09a8.237 8.237 0 00-4.31-1.09c-3.85 0-6.13 2.28-6.13 4.82 0 4.93 6.9 4.62 6.9 6.35 0 .55-.42.99-1.53.99-.79-.01-1.56-.28-2.19-.77-.32-.22-.62-.48-.88-.77l-2.84 2.96zm14.45 2.18h12.37v-4.05h-7.44v-1.86h5.47v-3.5h-5.47v-1.86h7.22v-4.05h-12.15v15.32zm14.45 0h4.93v-4.38h1.64l2.19 4.38h5.14l-2.96-5.47c.45-.27.86-.61 1.2-1.01.8-.94 1.23-2.14 1.2-3.37a5.503 5.503 0 00-5.52-5.48c-.09 0-.18 0-.28.01h-7.55v15.32zm4.93-8.53v-2.63h2.08c.73-.06 1.36.49 1.42 1.21.06.73-.49 1.36-1.21 1.42a.67.67 0 01-.2 0h-2.09z"/></svg>
      </Link>
    </div>
    <nav role="navigation" className={headerStyles.navigation}>
      {settings &&
        settings.content.main_navi.map((navitem, index) => (
          <SbEditable content={navitem} key={navitem._uid}>
            <Link to={`/${navitem.link.cached_url}`} key={index} prefetch="true" className={headerStyles.link}>
              {navitem.name}
            </Link>
          </SbEditable>
        ))}
    </nav>
  </header>
);

export default Nav;
