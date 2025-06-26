// --- Firebase & DOCX Imports (from global window object) ---
// Since we are using <script type="module">, we need to declare these as if they were imported.
// They are loaded globally via the <script> tags in index.html.
const auth = firebase.auth();
const db = firebase.firestore();

// --- DOM Elements ---
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('loginMessage');
const contactNote = document.querySelector('.contact-note');
const addNewUserBtn = document.getElementById('addNewUserBtn');
const newUserNameInput = document.getElementById('newUserName');
const newUserEmailInput = document.getElementById('newUserEmail');
const newUserPasswordInput = document.getElementById('newUserPassword');

let isSignupMode = false;

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
    if (signupButton) signupButton.addEventListener('click', toggleSignupMode);
    
    // Check URL parameters for a signup message
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

function toggleSignupMode() {
    isSignupMode = !isSignupMode;
    const formTitle = document.querySelector('#loginView h3');
    const buttonContainer = loginButton.parentElement;
    
    if (isSignupMode) {
        formTitle.textContent = 'تسجيل حساب جديد';
        loginButton.style.display = 'none';
        signupButton.textContent = 'إنشاء حساب';
        signupButton.style.backgroundColor = '#2c3e50';
        signupButton.style.color = '#fff';
        
        // Add new user fields
        const nameGroup = document.createElement('div');
        nameGroup.className = 'input-group';
        nameGroup.id = 'name-group';
        nameGroup.innerHTML = `
            <label for="userName">اسم المستخدم:</label>
            <input type="text" id="userName" required>
        `;
        emailInput.parentElement.before(nameGroup);
    } else {
        formTitle.textContent = 'تسجيل الدخول';
        loginButton.style.display = 'inline-block';
        signupButton.textContent = 'تسجيل جديد';
        signupButton.style.backgroundColor = 'transparent';
        signupButton.style.color = '#3498db';

        // Remove new user fields
        const nameGroup = document.getElementById('name-group');
        if (nameGroup) nameGroup.remove();
    }
}

// --- Authentication Logic ---
async function handleLogin() {
    const email = emailInput.value;
    const password = passwordInput.value;
    showMessage(loginMessage, '', false); // Clear message

    if (isSignupMode) {
        // Handle signup
        const userNameInput = document.getElementById('userName');
        const name = userNameInput.value.trim();

        if (!name) {
            showMessage(loginMessage, 'الرجاء إدخال اسم المستخدم.', true);
            return;
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            // Store user's name in Firestore
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'user'
            });
            // Redirect to login page with a success message
            window.location.href = 'index.html?signupSuccess=true';
        } catch (error) {
            console.error("Signup error:", error);
            if (error.code === 'auth/email-already-in-use') {
                showMessage(loginMessage, 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.', true);
            } else if (error.code === 'auth/weak-password') {
                showMessage(loginMessage, 'كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 أحرف على الأقل.', true);
            } else {
                showMessage(loginMessage, 'فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.', true);
            }
        }
    } else {
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
}
