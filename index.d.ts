import Vue, {ComponentOptions} from 'vue';

declare module "*.vue" {
  import Vue from 'vue';
  export default Vue;
}

/* Cite: https://stackoverflow.com/a/49090772 */
declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    layout?: string;
  }
}
