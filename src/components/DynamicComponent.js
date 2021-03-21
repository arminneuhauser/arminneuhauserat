import React from 'react'
import Intro from './Intro'
import FeaturedProjects from './FeaturedProjects'
import Placeholder from './Placeholder'

const Components = {
  'intro': Intro,
  'featured_projects': FeaturedProjects,
}

const DynamicComponent = ({blok}) => {
  if (typeof Components[blok.component] !== 'undefined') {
    const Component = Components[blok.component]
    return <Component blok={blok} key={blok._uid}/>
  }

  return  blok.component ? <Placeholder componentName={blok.component}/> : null
}

export default DynamicComponent
