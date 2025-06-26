// --- Firebase & DOCX Imports (from global window object) ---
const auth = firebase.auth();
const db = firebase.firestore();
import { exportSingleFlightToDocx } from './docx-export.js';

// --- DOM Elements ---
const logoutButton = document.getElementById('logoutButton');
const userNameDisplay = document.getElementById('userNameDisplay');
const userNameDisplayHeader = document.getElementById('userNameDisplay-header');
const messageContainer = document.getElementById('messageContainer');
const flightsList = document.getElementById('flightsList'); // Re-added

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
                loadUserFlights(user.uid); // Re-added to load past flights
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
    
    // Check if FLT.NO is filled, as it's the only required field.
    if (!fltNoInput.value.trim()) {
        showMessage(messageContainer, `الرجاء إدخال رقم الرحلة (FLT.NO) في البطاقة ${formNumber}.`, true);
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
    const formData = new FormData(form);
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
        loadUserFlights(currentUser.uid); // Refresh the table after adding
    } catch (error) {
        console.error("Error adding flight document: ", error);
        showMessage(messageContainer, `حدث خطأ أثناء إضافة الرحلة ${fltNoInput.value}.`, true);
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
            .where('timestamp', '>=', startOfMonth.getTime()) // Query using number
            .where('timestamp', '<=', endOfMonth.getTime()) // Query using number
            .orderBy('timestamp', 'desc') // Order by latest first
            .get();

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
            
            // Add a delete button as well for user convenience
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
            await db.collection('flights').doc(docId).delete();
            showMessage(messageContainer, 'تم حذف الرحلة بنجاح!', false);
            const currentUser = auth.currentUser;
            if (currentUser) {
                loadUserFlights(currentUser.uid); // Refresh the table
            }
        } catch (error) {
            console.error("Error deleting flight:", error);
            showMessage(messageContainer, `فشل في حذف الرحلة: ${error.message}`, true);
        }
    }
}
