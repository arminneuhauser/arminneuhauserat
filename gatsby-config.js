/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/gatsby-config/
 */

module.exports = {
  /* Your site config here */
  plugins: [
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-postcss`,
    `gatsby-plugin-sass`,
    {
      resolve: "gatsby-source-storyblok",
      options: {
        accessToken: "rSn0qhXpxorRlv4Btd8JoAtt",
        homeSlug: "startseite",
        version: process.env.NODE_ENV === "production" ? "published" : "draft",
      },
    },
  ],
}
