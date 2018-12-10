import Vue from 'vue'
import VueLazyload from 'vue-lazyload'
import { CommentPlugin } from '~/components/Comment'

Vue.use(VueLazyload, {
  preLoad: 1.5,
  attempt: 10
})

Vue.use(CommentPlugin)
