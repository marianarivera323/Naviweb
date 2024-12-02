// Import Firebase Auth instance
import { auth } from "naviAPP/public/firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Handle sign-up form submission
document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        alert("Sign-up successful!");
        window.location.href = "index.html"; // Redirect to home page
    } catch (error) {
        alert(`Error: ${error.message}`); // Display error message
    }
});
