// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVgIvEYJqLkWjuaSKHQbMbDpkIdWxOYbQ",
  authDomain: "futbol-miercoles.firebaseapp.com",
  projectId: "futbol-miercoles",
  storageBucket: "futbol-miercoles.firebasestorage.app",
  messagingSenderId: "418347898092",
  appId: "1:418347898092:web:5f54de06bf8a794ec041c9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();