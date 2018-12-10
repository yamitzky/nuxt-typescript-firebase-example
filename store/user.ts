import { DefineMutations } from 'vuex-type-helper'

interface State {
  uuid: string
}

interface Mutations {
  setUuid: string
}

export const state = (): State => ({
  uuid: ''
})

export const mutations: DefineMutations<Mutations, State> = {
  setUuid (state, uuid) {
    state.uuid = uuid
  }
}
