// --- Firebase & DOCX Imports (from global window object) ---
const auth = firebase.auth();
const db = firebase.firestore();
import { exportSingleFlightToDocx } from './docx-export.js';

// --- DOM Elements ---
const logoutButton = document.getElementById('logoutButton');
const userNameDisplay = document.getElementById('userNameDisplay');
const userNameDisplayHeader = document.getElementById('userNameDisplay-header');
const flightForm = document.getElementById('flightForm');
const messageContainer = document.getElementById('messageContainer');
const flightsList = document.getElementById('flightsList');

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
                loadUserFlights(user.uid);
            }
        } else {
            // No user is signed in, redirect to login page
            window.location.href = 'index.html';
        }
    });

    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (flightForm) flightForm.addEventListener('submit', handleFlightFormSubmit);
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
            if (userNameDisplay) userNameDisplay.textContent = user.email;
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

async function handleFlightFormSubmit(e) {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return; // Should not happen if page is protected

    const formData = new FormData(flightForm);
    const flightData = {
        userEmail: currentUser.email,
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
    };
    
    // Get user's name
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (userDoc.exists) {
        flightData.userName = userDoc.data().name;
    } else {
        flightData.userName = currentUser.email; // Fallback
    }

    let isFormEmpty = true;
    for (const [key, value] of formData.entries()) {
        flightData[key] = value.trim();
        if (value.trim() !== '') {
            isFormEmpty = false;
        }
    }

    if (isFormEmpty) {
        showMessage(messageContainer, 'الرجاء ملء الحقول المطلوبة قبل الإضافة.', true);
        return;
    }

    if (!flightData.date || !flightData.fltNo) {
        showMessage(messageContainer, 'حقل التاريخ ورقم الرحلة (FLT.NO) إجباريان.', true);
        return;
    }

    try {
        // Add a new document with a generated ID to the 'flights' collection
        await db.collection('flights').add(flightData);
        showMessage(messageContainer, 'تمت إضافة الرحلة بنجاح!', false);
        flightForm.reset(); // Clear the form
        loadUserFlights(currentUser.uid); // Refresh the table
    } catch (error) {
        console.error("Error adding flight document: ", error);
        showMessage(messageContainer, 'حدث خطأ أثناء إضافة الرحلة.', true);
    }
}

async function loadUserFlights(userId) {
    if (!flightsList) return;
    flightsList.innerHTML = ''; // Clear the table

    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        // Fetch flights for the current user within the current month
        const flightsRef = db.collection('flights');
        const querySnapshot = await flightsRef
            .where('userId', '==', userId)
            .where('timestamp', '>=', startOfMonth.toISOString())
            .where('timestamp', '<=', endOfMonth.toISOString())
            .orderBy('timestamp', 'desc') // Order by latest first
            .get();

        if (querySnapshot.empty) {
            const row = flightsList.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 6; // Adjusted to match the new table structure
            cell.textContent = 'لا توجد رحلات مسجلة لهذا الشهر.';
            cell.style.textAlign = 'center';
            cell.style.color = '#777';
            return;
        }

        querySnapshot.forEach(doc => {
            const flight = doc.data();
            const row = flightsList.insertRow();
            row.dataset.docId = doc.id; // Store Firebase document ID

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
            actionsCell.appendChild(exportBtn);
        });

    } catch (error) {
        console.error("Error loading user flights: ", error);
        showMessage(messageContainer, 'حدث خطأ أثناء تحميل الرحلات.', true);
    }
}
