// --- Supabase Imports and Initialization ---
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'

// Using the keys you provided.
const supabaseUrl = 'https://sbtxdlgdbajxnqrkggyh.supabase.co';
const supabaseAnonKey = 'EyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNidHhkbGdkYmFqeG5xcmtnZ3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjYyMjcsImV4cCI6MjA2NjU0MjIyN30.5j1vklOh3_XznXp0E-thW701FJV2T-8sxX1_1lY_EZo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Firebase Modular SDK Imports (Keep for Auth and users data) ---
// We keep Firestore imports for the 'users' collection which is still in Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { exportAdminDataToDocx } from './docx-export.js';

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
const db = getFirestore(app); // We still need this for the 'users' collection

// --- DOM Elements ---
const logoutButton = document.getElementById('logoutButton');
const userNameDisplay = document.getElementById('userNameDisplay');
const userManagementMessage = document.getElementById('userManagementMessage');

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
    onAuthStateChanged(auth, user => {
        if (user) {
            if (user.email === 'ahmedaltalqani@gmail.com') {
                // Admin is signed in
                if (userNameDisplay) userNameDisplay.textContent = user.email;
                
                // Set current month as default filter
                const today = new Date();
                const year = today.getFullYear();
                const month = (today.getMonth() + 1).toString().padStart(2, '0');
                if (monthFilter) monthFilter.value = `${year}-${month}`;
                
                // Load all data for the admin view
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

// --- Authentication Logic (using Firebase) ---
async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
        showMessage(userManagementMessage, "حدث خطأ أثناء تسجيل الخروج.", true);
    }
}

// --- Flight Data & Statistics (Admin - MODIFIED FOR SUPABASE) ---
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
        // --- Fetch all users from Firestore (not migrated yet) ---
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersMap = new Map();
        usersSnapshot.forEach(doc => usersMap.set(doc.id, doc.data()));
        
        // Populate the user filter dropdown with all users
        populateUserFilter(usersMap);
        
        // --- Fetch all flights from Supabase for the selected month (NEW) ---
        const { data: flightsData, error } = await supabase
            .from('flights')
            .select('*')
            .gte('timestamp', startOfMonth.getTime()) // >= timestamp
            .lte('timestamp', endOfMonth.getTime())   // <= timestamp
            .order('timestamp', { ascending: true });
        
        if (error) {
            throw error;
        }

        let allFlightsFiltered = [];
        let userFlightCounts = {};
        
        // --- Process the data from Supabase (it's an array, not a snapshot) ---
        flightsData.forEach(flight => {
            allFlightsFiltered.push({ id: flight.id, ...flight }); // Supabase returns `id` directly
            
            const userEmail = usersMap.get(flight.userId)?.email || 'غير معروف';
            userFlightCounts[userEmail] = (userFlightCounts[userEmail] || 0) + 1;
        });

        const selectedUserEmail = userFilter.value;
        const flightsToDisplay = selectedUserEmail === 'all' 
            ? allFlightsFiltered 
            : allFlightsFiltered.filter(flight => usersMap.get(flight.userId)?.email === selectedUserEmail);
            
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
    userFilter.innerHTML = '<option value="all">جميع المستخدمين</option>';

    const sortedUsers = Array.from(usersMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    sortedUsers.forEach(user => {
        if (user.email === 'ahmedaltalqani@gmail.com') return;

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
        cell.colSpan = 7;
        cell.textContent = 'لا توجد رحلات لعرضها بالفلاتر المحددة.';
        cell.style.textAlign = 'center';
        cell.style.color = '#777';
        return;
    }

    flights.forEach(flight => {
        const row = flightsTableBody.insertRow();
        row.dataset.docId = flight.id; // Supabase returns the ID as a property
        
        row.insertCell(0).textContent = flight.date || '';
        row.insertCell(1).textContent = flight.fltNo || '';
        row.insertCell(2).textContent = flight.onChocksTime || '';
        row.insertCell(3).textContent = flight.offChocksTime || '';
        row.insertCell(4).textContent = flight.notes || '';
        row.insertCell(5).textContent = usersMap.get(flight.userId)?.name || 'غير معروف';

        const actionsCell = row.insertCell(6);
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', () => editFlight(flight));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.addEventListener('click', () => deleteFlight(flight.id));
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

function displayAdminStats(userFlightCounts, totalFlights, usersMap) {
    if (!userStatsContainer || !totalFlightsSpan) return;

    userStatsContainer.innerHTML = '';
    totalFlightsSpan.textContent = totalFlights;

    const sortedUserEmails = Object.keys(userFlightCounts).sort((a, b) => {
        const nameA = Array.from(usersMap.values()).find(user => user.email === a)?.name || '';
        const nameB = Array.from(usersMap.values()).find(user => user.email === b)?.name || '';
        return nameA.localeCompare(b.name || '');
    });

    for (const userEmail of sortedUserEmails) {
        if (userEmail === 'ahmedaltalqani@gmail.com') continue;
        
        const userName = Array.from(usersMap.values()).find(user => user.email === userEmail)?.name || `المستخدم (${userEmail.split('@')[0]})`;
        
        const count = userFlightCounts[userEmail];
        
        const statCard = document.createElement('div');
        statCard.className = 'user-stat-card';
        statCard.innerHTML = `<h4>${userName}</h4><p>${count}</p>`;
        userStatsContainer.appendChild(statCard);
    }
}

// --- EDITING DATA (MODIFIED FOR SUPABASE) ---
async function editFlight(flight) {
    const newFltNo = prompt("تعديل رقم الرحلة (FLT.NO):", flight.fltNo);
    if (newFltNo === null) return;
    const newNotes = prompt("تعديل الملاحظات:", flight.notes);
    if (newNotes === null) return;

    try {
        // --- THIS IS THE NEW SUPABASE UPDATE LOGIC ---
        const { data, error } = await supabase
            .from('flights')
            .update({
                fltNo: newFltNo,
                notes: newNotes
            })
            .eq('id', flight.id); // Update the row where the 'id' matches
            
        if (error) {
            throw error;
        }

        showMessage(userManagementMessage, 'تم تحديث الرحلة بنجاح!', false);
        loadAdminData();
    } catch (error) {
        console.error("Error updating flight:", error);
        showMessage(userManagementMessage, `فشل في تحديث الرحلة: ${error.message}`, true);
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
                .eq('id', docId); // Delete the row where the 'id' matches
                
            if (error) {
                throw error;
            }

            showMessage(userManagementMessage, 'تم حذف الرحلة بنجاح!', false);
            loadAdminData();
        } catch (error) {
            console.error("Error deleting flight:", error);
            showMessage(userManagementMessage, `فشل في حذف الرحلة: ${error.message}`, true);
        }
    }
}
