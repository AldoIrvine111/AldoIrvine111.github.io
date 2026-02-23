import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuGnWeYrvh01yGw-CJZOTJfzdjgsbSpSU",
  authDomain: "cookbook-5.firebaseapp.com",
  projectId: "cookbook-5",
  storageBucket: "cookbook-5.firebasestorage.app",
  messagingSenderId: "918235645646",
  appId: "1:918235645646:web:f13d895fff2c335f10729f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider };