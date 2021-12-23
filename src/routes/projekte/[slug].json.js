import fs from 'fs'
import mi from 'markdown-it'
// import prism from 'markdown-it-prism'
import matter from 'gray-matter'

// Init markdown-it
const md = mi({
  html: true,
  linkify: true,
  typographer: true
})

// Remember old renderer, if overridden, or proxy to default renderer
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }

// Make external (http(s)://) links open in a new window
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const href = tokens[idx].attrs[tokens[idx].attrIndex('href')][1]
  if (href.startsWith('http')) {
    tokens[idx].attrPush(['rel', 'noopener noreferrer'])
    tokens[idx].attrPush(['target', '_blank'])
    // tokens[idx].attrPush(['class', 'external-link'])
  }
  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self)
}

// Use Prism for syntax highlighting
// md.use(prism)

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }) {
  const { slug } = params
  const doc = await fs.promises.readFile(`projects/${slug}.md`, 'utf8')
  // console.log(doc)
  const { data: metadata, content } = matter(doc)
  // console.log(metadata)
  // console.log(content)
  const html = md.render(content)

  return {
    body: JSON.stringify({ metadata, html })
  }
}