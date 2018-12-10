import firebase from '~/plugins/firebase'
import { DefineActions, DefineMutations } from 'vuex-type-helper'
import uuid from 'uuid/v4'

interface State {
  processing: File | null,
  uploaded: File | null,
  uploadedURL: string,
  progress: number
}

interface Mutations {
  setProcessing: { file: File }
  setUploaded: { url: string }
  clearUploaded
  setProgress: { progress: number }
}

interface Actions {
  upload: { file: File, partyId: string }
}

export const state = (): State => ({
  processing: null,
  uploaded: null,
  uploadedURL: '',
  progress: 0
})

export const mutations: DefineMutations<Mutations, State> = {
  setProcessing (state, { file }) {
    state.processing = file
    state.uploadedURL = ''
    state.progress = 0
  },
  setUploaded (state, { url }) {
    state.uploaded = state.processing
    state.processing = null
    state.uploadedURL = url
    state.progress = 1
  },
  clearUploaded (state) {
    state.uploaded = null
    state.processing = null
    state.uploadedURL = ''
    state.progress = 0
  },
  setProgress (state, { progress }) {
    state.progress = progress
  }
}

export const actions: DefineActions<Actions, State, Mutations> = {
  async upload ({ commit, rootState }, { file, partyId }) {
    const storageRef = firebase.storage().ref()
    const imageRef = storageRef.child(`images/${partyId}/${uuid()}-${rootState.user.uuid}-${file.name}`)
    const task = imageRef.put(file)

    commit('setProcessing', { file })
    task.on('state_changed', (snapshot: firebase.storage.UploadTaskSnapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes)
      commit('setProgress', { progress })
    })
    await task
    const url = await task.snapshot.ref.getDownloadURL()
    commit('setUploaded', { url })
  }
}
