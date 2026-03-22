import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyDbL7xNxPTCx3EqhUA2zyPlWQApdBmm-W0',
  authDomain: 'spendly-ff40a.firebaseapp.com',
  projectId: 'spendly-ff40a',
  appId: '1:552192142593:web:eb4258a229c80d45f37f00',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
