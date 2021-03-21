import React from 'react'
import { render } from 'storyblok-rich-text-react-renderer'
import SbEditable from 'storyblok-react'

import * as projectsStyles from './featured-projects.module.scss'

const Projects = ({ blok }) => {
  return (
    <SbEditable content={blok}>
      <div className={projectsStyles.intro}>
        <div>
          <h1>{ blok.headline }</h1>
          <div>
            {blok.projects &&
              blok.projects.map((project, index) => (
                <div>
                  { project.name }
                </div>
              ))}

          </div>
        </div>
      </div>
    </SbEditable>
  )
}

export default Projects
