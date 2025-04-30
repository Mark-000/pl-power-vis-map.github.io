// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA...",
  authDomain: "my-map-pj-54751.firebaseapp.com",
  projectId: "my-map-pj-54751",
  storageBucket: "my-map-pj-54751.appspot.com", // <-- виправлено
  messagingSenderId: "349429907738",
  appId: "1:349429907738:web:8a6d42bfeaf8eb0b612ca3",
  measurementId: "G-T4XGCQ6PDH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    const currentUrl = window.location.href;
    const loginUrl = `https://mark-000.github.io/pl-power-vis-map.github.io/login.html?redirect=${encodeURIComponent(currentUrl)}`;
    window.location.href = loginUrl;
  } else {
    console.log("User is logged in:", user.email);
    window.dispatchEvent(new CustomEvent('user-authenticated', { detail: user }));
  }
});

export { auth };
