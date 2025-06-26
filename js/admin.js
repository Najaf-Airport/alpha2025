// --- Firebase & DOCX Imports (from global window object) ---
const auth = firebase.auth();
const db = firebase.firestore();
import { exportAdminDataToDocx } from './docx-export.js';

// --- DOM Elements ---
const logoutButton = document.getElementById('logoutButton');
const userNameDisplay = document.getElementById('userNameDisplay');
const addNewUserBtn = document.getElementById('addNewUserBtn');
const newUserNameInput = document.getElementById('newUserName');
const newUserEmailInput = document.getElementById('newUserEmail');
const newUserPasswordInput = document.getElementById('newUserPassword');
const userManagementMessage = document.getElementById('userManagementMessage');
const adminUsersTableBody = document.querySelector('#adminUsersTable tbody');

const monthFilter = document.getElementById('monthFilter');
const userFilter = document.getElementById('userFilter');
const filterButton = document.getElementById('filterButton');
const totalFlightsSpan = document.getElementById('totalFlights');
const userStatsContainer = document.getElementById('userStatsContainer');
const exportStatsButton = document.getElementById('exportStatsButton');
const flightsTableBody = document.getElementById('flightsTableBody');
const exportDetailedButton = document.getElementById('exportDetailedButton');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Check auth state and redirect if not admin
    auth.onAuthStateChanged(user => {
        if (user) {
            if (user.email === 'ahmedaltalqani@gmail.com') {
                // Admin is signed in
                if (userNameDisplay) userNameDisplay.textContent = user.email;
                loadAdminUsers();
                
                // Set current month as default filter
                const today = new Date();
                const year = today.getFullYear();
                const month = (today.getMonth() + 1).toString().padStart(2, '0');
                if (monthFilter) monthFilter.value = `${year}-${month}`;
                
                loadAdminData();
            } else {
                // Regular user logged in, redirect
                window.location.href = 'flights.html';
            }
        } else {
            // No user signed in, redirect to login
            window.location.href = 'index.html';
        }
    });

    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (addNewUserBtn) addNewUserBtn.addEventListener('click', handleAddNewUser);
    if (filterButton) filterButton.addEventListener('click', loadAdminData);
    if (exportStatsButton) exportStatsButton.addEventListener('click', () => exportAdminDataToDocx('stats', window.adminStatsData, monthFilter.value, userFilter.value));
    if (exportDetailedButton) exportDetailedButton.addEventListener('click', () => exportAdminDataToDocx('allFlights', window.adminDetailedFlightsData, monthFilter.value, userFilter.value));
});

// --- Utility Functions ---
function showMessage(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.className = isError ? 'error-message' : 'success-message';
        setTimeout(() => { element.textContent = '', element.className = '' }, 5000);
    }
}

// --- Authentication Logic ---
async function handleLogout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Logout error:", error);
        showMessage(userManagementMessage, "حدث خطأ أثناء تسجيل الخروج.", true);
    }
}

// --- User Management (Admin) ---
async function handleAddNewUser() {
    const name = newUserNameInput.value.trim();
    const email = newUserEmailInput.value.trim();
    const password = newUserPasswordInput.value.trim();

    if (!name || !email || !password) {
        showMessage(userManagementMessage, 'جميع حقول المستخدم الجديد مطلوبة.', true);
        return;
    }

    try {
        // Create user in Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Store user details in Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            role: 'user'
        });

        showMessage(userManagementMessage, `تمت إضافة المستخدم ${name} بنجاح.`, false);
        newUserNameInput.value = '';
        newUserEmailInput.value = '';
        newUserPasswordInput.value = '';
        loadAdminUsers();
        loadAdminData(); // Refresh data to include the new user
    } catch (error) {
        console.error("Error adding user:", error);
        if (error.code === 'auth/email-already-in-use') {
            showMessage(userManagementMessage, 'هذا البريد الإلكتروني مسجل بالفعل.', true);
        } else if (error.code === 'auth/weak-password') {
             showMessage(userManagementMessage, 'كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 أحرف على الأقل.', true);
        } else {
            showMessage(userManagementMessage, `فشل في إضافة المستخدم: ${error.message}`, true);
        }
    }
}

async function loadAdminUsers() {
    if (!adminUsersTableBody) return;
    adminUsersTableBody.innerHTML = '';
    
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.email !== 'ahmedaltalqani@gmail.com') { // Exclude admin
                users.push({ id: doc.id, ...userData });
            }
        });
        
        users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        users.forEach(user => {
            const row = adminUsersTableBody.insertRow();
            row.insertCell(0).textContent = user.name || '';
            row.insertCell(1).textContent = user.email || '';
            row.insertCell(2).textContent = '********'; // Never display passwords
            
            const actionsCell = row.insertCell(3);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.addEventListener('click', () => deleteUser(user.id, user.email));
            
            actionsCell.appendChild(deleteBtn);
        });
    } catch (error) {
        console.error("Error loading users:", error);
        showMessage(userManagementMessage, "حدث خطأ أثناء تحميل قائمة المستخدمين.", true);
    }
}

async function deleteUser(userId, userEmail) {
    if (confirm(`هل أنت متأكد من حذف المستخدم ${userEmail}؟ سيؤدي هذا إلى حذف جميع رحلاته بشكل دائم.`)) {
        try {
            // Delete user's flights from Firestore
            const flightsSnapshot = await db.collection('flights').where('userId', '==', userId).get();
            const batch = db.batch();
            flightsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // Delete user from Firestore 'users' collection
            await db.collection('users').doc(userId).delete();
            
            // Note: Deleting from Firebase Authentication is a server-side task
            // and cannot be done from client-side code directly for security reasons.
            // A Cloud Function would be needed for that.
            // For now, this user will no longer appear in the app, but their Auth account remains.

            showMessage(userManagementMessage, `تم حذف المستخدم ${userEmail} وجميع رحلاته بنجاح.`, false);
            loadAdminUsers();
            loadAdminData();
        } catch (error) {
            console.error("Error deleting user and flights:", error);
            showMessage(userManagementMessage, `فشل في حذف المستخدم: ${error.message}`, true);
        }
    }
}

// --- Flight Data & Statistics (Admin) ---
async function loadAdminData() {
    if (!flightsTableBody || !userStatsContainer || !totalFlightsSpan || !monthFilter || !userFilter) return;
    
    flightsTableBody.innerHTML = '';
    userStatsContainer.innerHTML = '';
    totalFlightsSpan.textContent = '0';
    
    const selectedDate = monthFilter.value;
    if (!selectedDate) {
        showMessage(userManagementMessage, "يرجى اختيار الشهر والسنة للفلترة.", true);
        return;
    }
    
    const [year, month] = selectedDate.split('-');
    const startOfMonth = new Date(year, parseInt(month) - 1, 1);
    const endOfMonth = new Date(year, parseInt(month), 0, 23, 59, 59, 999);

    try {
        // Fetch all users
        const usersSnapshot = await db.collection('users').get();
        const usersMap = new Map();
        usersSnapshot.forEach(doc => usersMap.set(doc.id, doc.data()));
        
        // Fetch all flights for the selected month
        const flightsRef = db.collection('flights');
        const querySnapshot = await flightsRef
            .where('timestamp', '>=', startOfMonth.toISOString())
            .where('timestamp', '<=', endOfMonth.toISOString())
            .orderBy('timestamp', 'asc')
            .get();
        
        let allFlightsFiltered = [];
        let userFlightCounts = {};
        
        querySnapshot.forEach(doc => {
            const flight = doc.data();
            allFlightsFiltered.push({ id: doc.id, ...flight });
            
            // Count flights per user
            const userEmail = flight.userEmail;
            userFlightCounts[userEmail] = (userFlightCounts[userEmail] || 0) + 1;
        });

        // Populate the user filter dropdown
        populateUserFilter(usersMap);

        // Filter flights for display based on user selection
        const selectedUserEmail = userFilter.value;
        const flightsToDisplay = selectedUserEmail === 'all' 
            ? allFlightsFiltered 
            : allFlightsFiltered.filter(flight => flight.userEmail === selectedUserEmail);
            
        // Save data to global scope for export functions
        window.adminStatsData = { userFlightCounts, totalFlights: allFlightsFiltered.length, allUsersMap: usersMap };
        window.adminDetailedFlightsData = { flightsToExport: flightsToDisplay, usersStored: Object.fromEntries(usersMap) };

        displayAdminStats(userFlightCounts, allFlightsFiltered.length, usersMap);
        displayAdminFlights(flightsToDisplay, usersMap);

    } catch (error) {
        console.error("Error loading admin data:", error);
        showMessage(userManagementMessage, `حدث خطأ أثناء تحميل البيانات: ${error.message}`, true);
    }
}

function populateUserFilter(usersMap) {
    if (!userFilter) return;
    userFilter.innerHTML = '<option value="all">جميع المستخدمين</option>'; // Reset

    const sortedUsers = Array.from(usersMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    sortedUsers.forEach(user => {
        if (user.email === 'ahmedaltalqani@gmail.com') return; // Don't add admin to filter

        const option = document.createElement('option');
        option.value = user.email;
        option.textContent = user.name || user.email;
        userFilter.appendChild(option);
    });
}

function displayAdminFlights(flights, usersMap) {
    if (!flightsTableBody) return;
    flightsTableBody.innerHTML = '';
    
    if (flights.length === 0) {
        const row = flightsTableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 13; // Adjusted colSpan
        cell.textContent = 'لا توجد رحلات لعرضها بالفلاتر المحددة.';
        cell.style.textAlign = 'center';
        cell.style.color = '#777';
        return;
    }

    flights.forEach(flight => {
        const row = flightsTableBody.insertRow();
        row.dataset.docId = flight.id;
        
        row.insertCell(0).textContent = flight.date || '';
        row.insertCell(1).textContent = flight.fltNo || '';
        row.insertCell(2).textContent = flight.onChocksTime || '';
        row.insertCell(3).textContent = flight.offChocksTime || '';
        row.insertCell(4).textContent = flight.notes || '';
        row.insertCell(5).textContent = usersMap.get(flight.userId)?.name || flight.userName || 'غير معروف';

        const actionsCell = row.insertCell(6);
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', () => editFlight(flight));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.addEventListener('click', () => deleteFlight(flight.id, flight.userEmail));
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

function displayAdminStats(userFlightCounts, totalFlights, usersMap) {
    if (!userStatsContainer || !totalFlightsSpan) return;

    userStatsContainer.innerHTML = '';
    totalFlightsSpan.textContent = totalFlights;

    const sortedUserEmails = Object.keys(userFlightCounts).sort((a, b) => {
        const nameA = usersMap.get(a)?.name || '';
        const nameB = usersMap.get(b)?.name || '';
        return nameA.localeCompare(nameB);
    });

    for (const userEmail of sortedUserEmails) {
        if (userEmail === 'ahmedaltalqani@gmail.com') continue; // Skip admin
        
        const userName = usersMap.get(userEmail)?.name || `المستخدم (${userEmail.split('@')[0]})`;
        const count = userFlightCounts[userEmail];
        
        const statCard = document.createElement('div');
        statCard.className = 'user-stat-card';
        statCard.innerHTML = `<h4>${userName}</h4><p>${count}</p>`;
        userStatsContainer.appendChild(statCard);
    }
}

async function editFlight(flight) {
    const newFltNo = prompt("تعديل رقم الرحلة (FLT.NO):", flight.fltNo);
    if (newFltNo === null) return;
    const newNotes = prompt("تعديل الملاحظات:", flight.notes);
    if (newNotes === null) return;

    try {
        // Update the document in Firestore
        await db.collection('flights').doc(flight.id).update({
            fltNo: newFltNo,
            notes: newNotes
        });
        showMessage(userManagementMessage, 'تم تحديث الرحلة بنجاح!', false);
        loadAdminData(); // Refresh data to show changes
    } catch (error) {
        console.error("Error updating flight:", error);
        showMessage(userManagementMessage, `فشل في تحديث الرحلة: ${error.message}`, true);
    }
}

async function deleteFlight(docId, userEmail) {
    if (confirm("هل أنت متأكد من حذف هذه الرحلة؟")) {
        try {
            await db.collection('flights').doc(docId).delete();
            showMessage(userManagementMessage, 'تم حذف الرحلة بنجاح!', false);
            loadAdminData();
        } catch (error) {
            console.error("Error deleting flight:", error);
            showMessage(userManagementMessage, `فشل في حذف الرحلة: ${error.message}`, true);
        }
    }
}
