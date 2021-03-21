import React from 'react'
import { render } from 'storyblok-rich-text-react-renderer'
import SbEditable from 'storyblok-react'

import * as introStyles from './intro.module.scss'

const Intro = ({ blok }) => {
  return (
  <SbEditable content={blok}>
    <div className={introStyles.intro}>
      <div>
        <p>{ blok.kicker }</p>
        <h1>{ blok.headline }</h1>
      </div>
    </div>
  </SbEditable>
)
}

export default Intro
