module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'HAPPY WEDDING',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: 'https://cdn.materialdesignicons.com/2.0.46/css/materialdesignicons.min.css' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Noto+Serif+JP&amp;subset=japanese' }
    ]
  },
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#3B8070' },
  /*
  ** Build configuration
  */
  build: {},
  modules: [
    [ '~/modules/typescript.js' ],
    [ '@nuxtjs/google-analytics' ]
  ],
  plugins: [
    '~/plugins/global',
    '~/plugins/buefy',
    { src: '~/plugins/nossr', ssr: false }
  ],
  env: {
    firebaseConfig: process.env.FIREBASE_CONFIG
  },
  css: [
    { src: '@/assets/css/global.scss', lang: 'sass' },
    { src: '@/assets/css/buefy-overrides.scss', lang: 'sass' }
  ]
}

global.File = typeof window === 'undefined' ? Object : window.File
