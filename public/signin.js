// Import Firebase Auth instance
import { auth } from "naviAPP/public/firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Handle sign-in form submission
document.getElementById("signin-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Display a welcome message
        alert(`Welcome back, ${user.email}!`);

        // Debug log before redirection
        console.log("Redirecting to index.html...");

        // Redirect to the home page
        window.location.href = "naviAPP/public/index.html";
    } catch (error) {
        console.error("Sign-in error:", error);
        alert(`Error: ${error.message}`); // Show error message
    }
});
