// --- Firebase & DOCX Imports (from global window object) ---
// They are loaded globally via the <script> tags in index.html.
const auth = firebase.auth();
const db = firebase.firestore();

// --- DOM Elements ---
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
// signupButton and related elements are removed as per user request
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('loginMessage');
const contactNote = document.querySelector('.contact-note');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if a user is already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, redirect based on their role
            if (user.email === 'ahmedaltalqani@gmail.com') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'flights.html';
            }
        }
        // If not signed in, stay on the login page
    });

    if (loginButton) loginButton.addEventListener('click', handleLogin);
    
    // Check URL parameters for a signup message (removed as signup is no longer an option)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('signupSuccess') === 'true') {
        showMessage(loginMessage, 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.', false);
    }
});

// --- Utility Functions ---
function showMessage(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.className = isError ? 'error-message' : 'success-message';
        setTimeout(() => { element.textContent = ''; element.className = ''; }, 5000);
    }
}

// --- Authentication Logic (Login Only) ---
async function handleLogin() {
    const email = emailInput.value;
    const password = passwordInput.value;
    showMessage(loginMessage, '', false); // Clear message

    // Handle login
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // Redirection is handled by the onAuthStateChanged listener
    } catch (error) {
        console.error("Login error:", error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            showMessage(loginMessage, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', true);
        } else {
            showMessage(loginMessage, 'فشل في تسجيل الدخول. يرجى التحقق من اتصالك بالإنترنت.', true);
        }
    }
}
