import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/functions'
import 'firebase/storage'

if (!firebase.apps.length) {
  firebase.initializeApp(JSON.parse(process.env.firebaseConfig || ''))
  const firestore = firebase.firestore()
  firestore.settings({ timestampsInSnapshots: true })
}

export default firebase
