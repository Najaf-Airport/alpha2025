// --- Supabase Imports and Initialization ---
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'

// You provided these keys, so we'll use them directly.
const supabaseUrl = 'https://sbtxdlgdbajxnqrkggyh.supabase.co';
const supabaseAnonKey = 'EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNidHhkbGdkYmFqeG5xcmtnZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjYyMjcsImV4cCI6MjA2NjU0MjIyN30.5j1vklOh3_XznXp0E-thW701FJV2T-8sxX1_1lY_EZo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Firebase Auth Imports (Keep for authentication) ---
// We will continue to use Firebase for user authentication, as migrating it is more complex.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
// NOTE: Firebase Firestore imports (getFirestore, collection, etc.) have been removed.
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js"; // getDoc is still needed for user data
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

// --- Initialize Firebase Auth and services ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Still needed for fetching user data from 'users' collection

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

// --- Authentication Logic (using Firebase) ---
async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
        showMessage(messageContainer, "حدث خطأ أثناء تسجيل الخروج.", true);
    }
}

// --- Data & Display Logic ---
// This function still uses Firebase Firestore to fetch user name.
async function displayUserInfo(user) {
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userNameDisplay) userNameDisplay.textContent = userData.name || user.email;
            if (userNameDisplayHeader) userNameDisplayHeader.textContent = `مرحباً بك، ${userData.name || 'مستخدم'}!`;
        } else {
            if (userNameDisplay) userNameDisplay.textContent = user.email;
            if (userNameDisplayHeader) userNameDisplayHeader.textContent = `مرحباً بك، ${user.email}!`;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        if (userNameDisplay) userNameDisplay.textContent = user.email;
        if (userNameDisplayHeader) userNameDisplayHeader.textContent = `مرحباً بك، ${user.email}!`;
    }
}

// --- ADDING DATA (MODIFIED FOR SUPABASE) ---
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
        // --- THIS IS THE NEW SUPABASE INSERT LOGIC ---
        const { data, error } = await supabase
            .from('flights') // The table name you created
            .insert([flightData]);
            
        if (error) {
            throw error; // Throw the error to be caught by the catch block
        }
        
        showMessage(messageContainer, `تمت إضافة بيانات الرحلة ${fltNoInput.value} بنجاح!`, false);
        form.reset();
        loadUserFlights(currentUser.uid);
    } catch (error) {
        console.error("Error adding flight document: ", error);
        showMessage(messageContainer, `حدث خطأ أثناء إضافة الرحلة.`, true);
    }
}

// --- LOADING DATA (MODIFIED FOR SUPABASE) ---
async function loadUserFlights(userId) {
    if (!flightsList) return;
    flightsList.innerHTML = '';

    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        // --- THIS IS THE NEW SUPABASE QUERY LOGIC ---
        const { data: flightsData, error } = await supabase
            .from('flights')
            .select('*') // Select all columns
            .eq('userId', userId) // Where userId equals the current user's ID
            .gte('timestamp', startOfMonth.getTime()) // Greater than or equal to start of month
            .lte('timestamp', endOfMonth.getTime()) // Less than or equal to end of month
            .order('timestamp', { ascending: false }); // Order by timestamp descending
            
        if (error) {
            throw error;
        }
        
        // --- The data is now a simple array, not a snapshot ---
        if (!flightsData || flightsData.length === 0) {
            const row = flightsList.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6;
            cell.textContent = 'لا توجد رحلات مسجلة لهذا الشهر.';
            cell.style.textAlign = 'center';
            cell.style.color = '#777';
            return;
        }

        flightsData.forEach(flight => {
            const row = flightsList.insertRow();
            // Supabase returns the ID as a property of the data object
            row.dataset.docId = flight.id;

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
            // We pass the flight's ID to the delete function
            deleteBtn.addEventListener('click', () => deleteFlight(flight.id));

            actionsCell.appendChild(exportBtn);
            actionsCell.appendChild(deleteBtn);
        });

    } catch (error) {
        console.error("Error loading user flights: ", error);
        showMessage(messageContainer, 'حدث خطأ أثناء تحميل الرحلات.', true);
    }
}

// --- DELETING DATA (MODIFIED FOR SUPABASE) ---
async function deleteFlight(docId) {
    if (confirm("هل أنت متأكد من حذف هذه الرحلة؟")) {
        try {
            // --- THIS IS THE NEW SUPABASE DELETE LOGIC ---
            const { error } = await supabase
                .from('flights')
                .delete()
                .eq('id', docId); // Delete the row where the 'id' column equals the docId

            if (error) {
                throw error;
            }
            
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
