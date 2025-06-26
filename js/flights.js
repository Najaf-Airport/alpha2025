// --- Firebase Modular SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc, query, where, orderBy, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js";
import { exportSingleFlightToDocx } from './docx-export.js';

// --- Your web app's Firebase configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyAIz4dQIZS41PcfL3qXOhc-ybouBZWMjuc",
    authDomain: "najfe2025.firebaseapp.com",
    projectId: "najfe2025",
    storageBucket: "najfe2025.firebasestorage.app",
    messagingSenderId: "113306479969",
    appId: "1:113306479969:web:27a72a1c3da7918a18e920",
    measurementId: "G-6FPSTZH2X1"
};

// --- Initialize Firebase and services ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM Elements ---
const logoutButton = document.getElementById('logoutButton');
const userNameDisplay = document.getElementById('userNameDisplay');
const userNameDisplayHeader = document.getElementById('userNameDisplay-header');
const messageContainer = document.getElementById('messageContainer');
const flightsList = document.getElementById('flightsList');

// Get all four flight forms by their IDs
const flightForm1 = document.getElementById('flightForm1');
const flightForm2 = document.getElementById('flightForm2');
const flightForm3 = document.getElementById('flightForm3');
const flightForm4 = document.getElementById('flightForm4');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Check auth state and redirect if needed
    onAuthStateChanged(auth, user => {
        if (user) {
            if (user.email === 'ahmedaltalqani@gmail.com') {
                // Admin logged in, but on user page
                window.location.href = 'admin.html';
            } else {
                // Regular user logged in
                displayUserInfo(user);
                loadUserFlights(user.uid);
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
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
        showMessage(messageContainer, "حدث خطأ أثناء تسجيل الخروج.", true);
    }
}

// --- Data & Display Logic ---
async function displayUserInfo(user) {
    try {
        // Fetch user's name from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
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

    const form = document.getElementById(`flightForm${formNumber}`);
    if (!form) return;

    const fltNoInput = document.getElementById(`fltNo${formNumber}`);
    
    if (!fltNoInput.value.trim()) {
        showMessage(messageContainer, `الرجاء إدخال رقم الرحلة (FLT.NO) في البطاقة ${formNumber}.`, true);
        return;
    }
    
    const flightData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        timestamp: new Date().getTime()
    };
    
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
        flightData.userName = userDoc.data().name;
    } else {
        flightData.userName = currentUser.email;
    }

    const formData = new FormData(form);
    formData.forEach((value, key) => {
        const newKey = key.replace(formNumber, '');
        flightData[newKey] = value.trim() || '';
    });
    
    try {
        await addDoc(collection(db, 'flights'), flightData);
        showMessage(messageContainer, `تمت إضافة بيانات الرحلة ${fltNoInput.value} بنجاح!`, false);
        form.reset();
        loadUserFlights(currentUser.uid);
    } catch (error) {
        console.error("Error adding flight document: ", error);
        showMessage(messageContainer, `حدث خطأ أثناء إضافة الرحلة.`, true);
    }
}

async function loadUserFlights(userId) {
    if (!flightsList) return;
    flightsList.innerHTML = '';

    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const flightsQuery = query(
            collection(db, 'flights'),
            where('userId', '==', userId),
            where('timestamp', '>=', startOfMonth.getTime()),
            where('timestamp', '<=', endOfMonth.getTime()),
            orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(flightsQuery);

        if (querySnapshot.empty) {
            const row = flightsList.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6;
            cell.textContent = 'لا توجد رحلات مسجلة لهذا الشهر.';
            cell.style.textAlign = 'center';
            cell.style.color = '#777';
            return;
        }

        querySnapshot.forEach(doc => {
            const flight = doc.data();
            const row = flightsList.insertRow();
            row.dataset.docId = doc.id;

            row.insertCell(0).textContent = flight.date || '';
            row.insertCell(1).textContent = flight.fltNo || '';
            row.insertCell(2).textContent = flight.onChocksTime || '';
            row.insertCell(3).textContent = flight.offChocksTime || '';
            row.insertCell(4).textContent = flight.notes || '';

            const actionsCell = row.insertCell(5);
            const exportBtn = document.createElement('button');
            exportBtn.className = 'export-btn small-btn';
            exportBtn.innerHTML = '<i class="fas fa-file-word"></i> تصدير';
            exportBtn.addEventListener('click', () => exportSingleFlightToDocx(flight));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn small-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> حذف';
            deleteBtn.addEventListener('click', () => deleteFlight(doc.id));

            actionsCell.appendChild(exportBtn);
            actionsCell.appendChild(deleteBtn);
        });

    } catch (error) {
        console.error("Error loading user flights: ", error);
        showMessage(messageContainer, 'حدث خطأ أثناء تحميل الرحلات.', true);
    }
}

async function deleteFlight(docId) {
    if (confirm("هل أنت متأكد من حذف هذه الرحلة؟")) {
        try {
            await deleteDoc(doc(db, 'flights', docId));
            showMessage(messageContainer, 'تم حذف الرحلة بنجاح!', false);
            const currentUser = auth.currentUser;
            if (currentUser) {
                loadUserFlights(currentUser.uid);
            }
        } catch (error) {
            console.error("Error deleting flight:", error);
            showMessage(messageContainer, `فشل في حذف الرحلة: ${error.message}`, true);
        }
    }
}
