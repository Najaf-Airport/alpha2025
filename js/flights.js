// --- Firebase & DOCX Imports (from global window object) ---
const auth = firebase.auth();
const db = firebase.firestore();
import { exportSingleFlightToDocx } from './docx-export.js';

// --- DOM Elements ---
const logoutButton = document.getElementById('logoutButton');
const userNameDisplay = document.getElementById('userNameDisplay');
const userNameDisplayHeader = document.getElementById('userNameDisplay-header');
const messageContainer = document.getElementById('messageContainer');

// Get all four flight forms by their IDs
const flightForm1 = document.getElementById('flightForm1');
const flightForm2 = document.getElementById('flightForm2');
const flightForm3 = document.getElementById('flightForm3');
const flightForm4 = document.getElementById('flightForm4');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Check auth state and redirect if needed
    auth.onAuthStateChanged(user => {
        if (user) {
            if (user.email === 'ahmedaltalqani@gmail.com') {
                // Admin logged in, but on user page
                window.location.href = 'admin.html';
            } else {
                // Regular user logged in
                displayUserInfo(user);
                // loadUserFlights(user.uid); // This is removed as per user request
            }
        } else {
            // No user is signed in, redirect to login page
            window.location.href = 'index.html';
        }
    });

    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    
    // Add event listeners for all four forms
    if (flightForm1) flightForm1.addEventListener('submit', (e) => handleFlightFormSubmit(e, 1));
    if (flightForm2) flightForm2.addEventListener('submit', (e) => handleFlightFormSubmit(e, 2));
    if (flightForm3) flightForm3.addEventListener('submit', (e) => handleFlightFormSubmit(e, 3));
    if (flightForm4) flightForm4.addEventListener('submit', (e) => handleFlightFormSubmit(e, 4));
});

// --- Utility Functions ---
function showMessage(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.className = isError ? 'error-message' : 'success-message';
        setTimeout(() => { element.textContent = ''; element.className = ''; }, 5000);
    }
}

// --- Authentication Logic ---
async function handleLogout() {
    try {
        await auth.signOut();
        // Redirect to login page is handled by the onAuthStateChanged listener
    } catch (error) {
        console.error("Logout error:", error);
        showMessage(messageContainer, "حدث خطأ أثناء تسجيل الخروج.", true);
    }
}

// --- Data & Display Logic ---
async function displayUserInfo(user) {
    try {
        // Fetch user's name from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userNameDisplay) userNameDisplay.textContent = userData.name || user.email;
            if (userNameDisplayHeader) userNameDisplayHeader.textContent = `مرحباً بك، ${userData.name || 'مستخدم'}!`;
        } else {
            // Fallback if user document doesn't exist
            if (userNameDisplay) userNameDisplay.textContent = user.email;
            if (userNameDisplayHeader) userNameDisplayHeader.textContent = `مرحباً بك، ${user.email}!`;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        if (userNameDisplay) userNameDisplay.textContent = user.email;
        if (userNameDisplayHeader) userNameDisplayHeader.textContent = `مرحباً بك، ${user.email}!`;
    }
}

async function handleFlightFormSubmit(e, formNumber) {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Get the specific form that was submitted
    const form = document.getElementById(`flightForm${formNumber}`);
    if (!form) return;

    const fltNoInput = document.getElementById(`fltNo${formNumber}`);
    const dateInput = document.getElementById(`date${formNumber}`);
    
    // Check if FLT.NO is filled, as it's the only required field.
    if (!fltNoInput.value.trim()) {
        showMessage(messageContainer, `الرجاء إدخال رقم الرحلة (FLT.NO) في البطاقة ${formNumber}.`, true);
        return;
    }
    
    // Check if at least one field is filled besides fltNo
    const formData = new FormData(form);
    let isFormEmpty = true;
    for (const [key, value] of formData.entries()) {
        if (key !== `fltNo${formNumber}` && key !== `date${formNumber}` && value.trim() !== '') {
            isFormEmpty = false;
            break;
        }
    }

    // Don't save if only the flight number is entered
    if (isFormEmpty && !fltNoInput.value.trim()) {
         showMessage(messageContainer, `الرجاء ملء حقل رقم الرحلة (FLT.NO) على الأقل في البطاقة ${formNumber}.`, true);
         return;
    }

    const flightData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        timestamp: new Date().getTime() // Use timestamp in milliseconds for easier querying
    };
    
    // Get user's name from Firestore
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (userDoc.exists) {
        flightData.userName = userDoc.data().name;
    } else {
        flightData.userName = currentUser.email; // Fallback
    }

    // Populate flightData object with form values
    formData.forEach((value, key) => {
        // Remove the form number suffix from the key (e.g., fltNo1 -> fltNo)
        const newKey = key.replace(formNumber, '');
        flightData[newKey] = value.trim() || '';
    });

    try {
        // Add a new document to the 'flights' collection
        await db.collection('flights').add(flightData);
        showMessage(messageContainer, `تمت إضافة بيانات الرحلة ${fltNoInput.value} بنجاح!`, false);
        form.reset(); // Clear the specific form
    } catch (error) {
        console.error("Error adding flight document: ", error);
        showMessage(messageContainer, `حدث خطأ أثناء إضافة الرحلة ${fltNoInput.value}.`, true);
    }
}
