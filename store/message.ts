import firebase from '~/plugins/firebase'
import { QueryDocumentSnapshot } from '@firebase/firestore-types'
import { DefineMutations, DefineActions, DefineGetters } from 'vuex-type-helper'
import Vue from 'vue'
import { firestore } from 'firebase'

const PAGE_SIZE = 50

function snapToMessage (doc: QueryDocumentSnapshot): Message | undefined {
  const data = doc.data()
  let createdAt: number | null = null
  if (data.createdAt && data.createdAt.toMillis) {
    createdAt = data.createdAt.toMillis()
  } else if (doc.metadata.hasPendingWrites) {
    createdAt = Date.now()
  }

  if (createdAt) {
    const message = {
      ...data,
      id: doc.id,
      createdAt
    }
    return message
  }
}

// TODO: pagination
function buildQuery (db: firestore.Firestore, { partyId, limit }: { partyId: string, limit?: number }) {
  let query = db.collection('parties')
    .doc(partyId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
  if (limit) {
    query = query.limit(limit || PAGE_SIZE)
  }
  return query
}

export interface Message {
  id: string
  imageURL?: string
  thumbURL?: string
  text?: string
  createdAt: number
}

export interface ImageMessage {
  id: string
  imageURL: string
  thumbURL: string
  createdAt: number
}

export interface CommentMessage {
  id: string
  text: string
  createdAt: number
}

export interface NewMessage {
  text?: string
}

interface State {
  list: Message[]
  unsubscribe: (() => void) | null
  subscribingId: string
}

interface Getters {
  images: ImageMessage[]
  comments: CommentMessage[]
}

interface Mutations {
  prepend: { message: Message }
  append: { message: Message }
  update: { message: Message }
  remove: { message: Message }
  reset
  updateSubscription: { unsubscribe?: () => void, partyId?: string }
}

// TODO: delete message by auth?
interface Actions {
  load: { partyId: string, limit?: number }
  subscribe: { partyId: string, limit?: number }
  post: { message: NewMessage, partyId: string }
}

export const state = (): State => ({
  list: [],
  unsubscribe: null,
  subscribingId: ''
})

export const getters: DefineGetters<Getters, State> = {
  images (state) {
    return state.list.filter(m => m.thumbURL) as ImageMessage[]
  },
  comments (state) {
    return state.list.filter(m => m.text) as CommentMessage[]
  }
}

export const mutations: DefineMutations<Mutations, State> = {
  prepend (state, { message }) {
    state.list.unshift(message)
  },
  append (state, { message }) {
    state.list.push(message)
  },
  reset (state) {
    state.list = []
  },
  update (state, { message }) {
    state.list.forEach(({ id }, index) => {
      if (id === message.id) {
        Vue.set(state.list, index, message)
      }
    })
  },
  remove (state, { message }) {
    state.list = state.list.filter(({ id }) => id !== message.id)
  },
  updateSubscription (state, { unsubscribe, partyId }) {
    state.unsubscribe = unsubscribe || null
    state.subscribingId = partyId || ''
  }
}

export const actions: DefineActions<Actions, State, Mutations> = {
  async load ({ commit }, { partyId, limit }) {
    const db = firebase.firestore()

    const snap = await buildQuery(db, { partyId, limit }).get()
    commit('reset')
    snap.forEach(doc => {
      const message = snapToMessage(doc)
      if (message) {
        commit('append', { message })
      }
    })
  },

  subscribe ({ state, commit }, { partyId, limit }) {
    if (partyId === state.subscribingId) {
      return
    }
    if (state.unsubscribe) {
      state.unsubscribe()
      commit('updateSubscription')
    }
    const db = firebase.firestore()
    let reset = false
    const unsubscribe = buildQuery(db, { partyId, limit })
      .onSnapshot(snap => {
        if (!reset) {
          commit('reset')
          reset = true
        }
        snap.docChanges().forEach(change => {
          const message = snapToMessage(change.doc)
          if (message) {
            if (change.type === 'added') {
              commit(change.newIndex ? 'append' : 'prepend', { message })
            } else if (change.type === 'modified') {
              commit('update', { message })
            } else if (change.type === 'removed') {
              commit('remove', { message })
            }
          }
        })
      })
    commit('updateSubscription', { partyId, unsubscribe })
  },

  async post ({ rootState }, { message, partyId }) {
    const db = firebase.firestore()

    await db.collection('parties').doc(partyId).collection('messages').add({
      ...message,
      user: rootState.user.uuid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
  }
}
