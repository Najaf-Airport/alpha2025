// --- Global Constants ---
import { exportSingleFlightToDocx, exportAdminDataToDocx } from './docx-export.js'; // أضف هذا السطر

const ADMIN_EMAIL = 'ahmedaltalqani@gmail.com';
const ADMIN_PASSWORD = 'aas12aas12'; // For local storage
const USERS_STORAGE_KEY = 'najaf_flights_users';
const FLIGHTS_STORAGE_KEY = 'najaf_flights_data';
const LOGGED_IN_USER_KEY = 'najaf_flights_logged_in_user';

// --- DOM Elements ---
let loginForm, emailInput, passwordInput, loginMessage;
let logoutBtn, userEmailSpan;
let welcomeMessage, flightFormsContainer, saveAllFlightsBtn, messageContainer, userPastFlightsTableBody, currentMonthNameSpan;
let newUserNameInput, newUserEmailInput, newUserPasswordInput, addNewUserBtn, userManagementMessage;
let adminUsersTableBody;
let adminStatsTitle, filterMonthInput, filterUserSelect, applyFiltersBtn, userStatsContainer, totalFlightsCountSpan, exportAdminStatsToWordBtn, adminAllFlightsTableBody, exportAdminAllFlightsToWordBtn;

// --- Data Structures (Local Storage) ---
// Users: { email: { password: '...', name: '...', uid: '...' }, ... }
// Flights: { userId: { year: { month: { flightId: { date: '...', fltNo: '...', ... }, ... }, ... }, ... }, ... }

// --- Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Shared elements
    logoutBtn = document.getElementById('logoutBtn');
    userEmailSpan = document.getElementById('userEmail');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Login View (index.html)
    if (document.getElementById('loginView')) {
        loginForm = document.getElementById('loginForm');
        emailInput = document.getElementById('email');
        passwordInput = document.getElementById('password');
        loginMessage = document.getElementById('loginMessage');
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
    }

    // Flights View (flights.html)
    if (document.getElementById('flightsView')) {
        welcomeMessage = document.getElementById('welcomeMessage');
        flightFormsContainer = document.getElementById('flightFormsContainer');
        saveAllFlightsBtn = document.getElementById('saveAllFlightsBtn');
        messageContainer = document.getElementById('messageContainer');
        userPastFlightsTableBody = document.querySelector('#userPastFlightsTable tbody');
        currentMonthNameSpan = document.getElementById('currentMonthName');
        
        if (saveAllFlightsBtn) saveAllFlightsBtn.addEventListener('click', saveAllFlights);
        
        generateFlightForms(4); // Generate 4 flight cards
        const today = new Date();
        currentMonthNameSpan.textContent = today.toLocaleString('ar-IQ', { month: 'long' });
    }

    // Admin View (admin.html)
    if (document.getElementById('adminView')) {
        newUserNameInput = document.getElementById('newUserName');
        newUserEmailInput = document.getElementById('newUserEmail');
        newUserPasswordInput = document.getElementById('newUserPassword');
        addNewUserBtn = document.getElementById('addNewUserBtn');
        userManagementMessage = document.getElementById('userManagementMessage');
        adminUsersTableBody = document.querySelector('#adminUsersTable tbody');

        adminStatsTitle = document.getElementById('adminStatsTitle');
        filterMonthInput = document.getElementById('filterMonth');
        filterUserSelect = document.getElementById('filterUser');
        applyFiltersBtn = document.getElementById('applyFiltersBtn');
        userStatsContainer = document.getElementById('userStatsContainer');
        totalFlightsCountSpan = document.getElementById('totalFlightsCount');
        exportAdminStatsToWordBtn = document.getElementById('exportAdminStatsToWordBtn');
        adminAllFlightsTableBody = document.querySelector('#adminAllFlightsTable tbody');
        exportAdminAllFlightsToWordBtn = document.getElementById('exportAdminAllFlightsToWordBtn');

        if (addNewUserBtn) addNewUserBtn.addEventListener('click', handleAddNewUser);
        if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', loadAdminData);
        if (exportAdminStatsToWordBtn) exportAdminStatsToWordBtn.addEventListener('click', () => exportAdminDataToWord('stats'));
        if (exportAdminAllFlightsToWordBtn) exportAdminAllFlightsToWordBtn.addEventListener('click', () => exportAdminDataToWord('allFlights'));

        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        if (filterMonthInput) filterMonthInput.value = `${year}-${month}`;
        if (adminStatsTitle) updateAdminStatsTitle(year, month);
    }

    checkAuthState(); // Check who is logged in
});

// --- Utility Functions ---
function getStoredUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || {};
    } catch (e) {
        console.error("Error parsing users from localStorage:", e);
        return {};
    }
}

function setStoredUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getStoredFlights() {
    try {
        return JSON.parse(localStorage.getItem(FLIGHTS_STORAGE_KEY)) || {};
    } catch (e) {
        console.error("Error parsing flights from localStorage:", e);
        return {};
    }
}

function setStoredFlights(flights) {
    localStorage.setItem(FLIGHTS_STORAGE_KEY, JSON.stringify(flights));
}

function getLoggedInUser() {
    try {
        return JSON.parse(localStorage.getItem(LOGGED_IN_USER_KEY));
    } catch (e) {
        console.error("Error parsing logged in user from localStorage:", e);
        return null;
    }
}

function setLoggedInUser(user) {
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
}

function clearLoggedInUser() {
    localStorage.removeItem(LOGGED_IN_USER_KEY);
}

function showMessage(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.className = isError ? 'error-message' : 'success-message';
        setTimeout(() => { element.textContent = ''; element.className = ''; }, 5000);
    }
}

// Simple unique ID generator (for local data, not true UUID)
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// --- Authentication Logic ---
async function checkAuthState() {
    const user = getLoggedInUser();
    const currentPath = window.location.pathname;
    const isOnLoginPage = currentPath.includes('index.html') || currentPath === '/NajafFlightsApp/' || currentPath === '/'; // Handle root path as login page

    if (user) {
        if (userEmailSpan) userEmailSpan.textContent = user.email;
        if (logoutBtn) logoutBtn.style.display = 'inline-block';

        if (user.email === ADMIN_EMAIL) {
            if (isOnLoginPage || currentPath.includes('flights.html')) {
                window.location.href = 'admin.html';
            } else if (currentPath.includes('admin.html')) {
                loadAdminUsers();
                loadAdminData();
            }
        } else { // Regular user
            if (isOnLoginPage || currentPath.includes('admin.html')) {
                window.location.href = 'flights.html';
            } else if (currentPath.includes('flights.html')) {
                let userName = localStorage.getItem(`userName_${user.email}`);
                if (!userName) {
                    userName = prompt("مرحباً بك! يرجى إدخال اسمك (سيتم حفظه تلقائياً):");
                    if (userName) {
                        localStorage.setItem(`userName_${user.email}`, userName);
                    } else {
                        alert("يجب إدخال اسم لتتمكن من استخدام التطبيق. سيتم تسجيل خروجك.");
                        handleLogout();
                        return;
                    }
                }
                if (welcomeMessage) welcomeMessage.textContent = `مرحباً بك، ${userName}!`;
                loadUserFlights(user.email);
            }
        }
    } else { // No user logged in
        if (!isOnLoginPage) {
            window.location.href = 'index.html';
        }
        if (userEmailSpan) userEmailSpan.textContent = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
        localStorage.removeItem('userName'); // Clear any stored user name for current session
    }
}


async function handleLogin(e) {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    showMessage(loginMessage, '', false); // Clear previous messages

    const users = getStoredUsers();
    
    // Check for admin
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const adminUser = { email: ADMIN_EMAIL, name: 'Admin', uid: 'admin' }; // Assign a fixed UID for admin
        setLoggedInUser(adminUser);
        window.location.href = 'admin.html';
        return;
    }

    // Check for regular user
    let userFound = false;
    for (const userEmail in users) {
        if (userEmail === email && users[userEmail].password === password) {
            setLoggedInUser(users[userEmail]);
            userFound = true;
            window.location.href = 'flights.html';
            return;
        }
    }

    if (!userFound) {
        showMessage(loginMessage, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', true);
    }
}

async function handleLogout() {
    clearLoggedInUser();
    window.location.href = 'index.html';
}


// --- User Management (Admin View) ---
function loadAdminUsers() {
    if (!adminUsersTableBody) return;
    adminUsersTableBody.innerHTML = '';
    const users = getStoredUsers();

    // Sort users alphabetically by name
    const sortedUsers = Object.values(users).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    sortedUsers.forEach(user => {
        if (user.email === ADMIN_EMAIL) return; // Don't list admin in this table

        const row = adminUsersTableBody.insertRow();
        row.insertCell(0).textContent = user.name || '';
        row.insertCell(1).textContent = user.email || '';
        row.insertCell(2).textContent = user.password || '********'; // Never show real password
        
        const actionsCell = row.insertCell(3);
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', () => editUser(user.email));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.addEventListener('click', () => deleteUser(user.email));
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
    });
}

async function handleAddNewUser() {
    const name = newUserNameInput.value.trim();
    const email = newUserEmailInput.value.trim();
    const password = newUserPasswordInput.value.trim();

    if (!name || !email || !password) {
        showMessage(userManagementMessage, 'جميع حقول المستخدم الجديد مطلوبة.', true);
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage(userManagementMessage, 'صيغة البريد الإلكتروني غير صحيحة.', true);
        return;
    }

    const users = getStoredUsers();
    if (users[email]) {
        showMessage(userManagementMessage, 'هذا البريد الإلكتروني موجود بالفعل.', true);
        return;
    }

    // Assign a simple UID for local storage uniqueness
    const newUid = generateUniqueId();
    users[email] = { name, email, password, uid: newUid };
    setStoredUsers(users);
    
    showMessage(userManagementMessage, `تمت إضافة المستخدم ${name} بنجاح.`, false);
    newUserNameInput.value = '';
    newUserEmailInput.value = '';
    newUserPasswordInput.value = '';
    loadAdminUsers(); // Reload table
}

function editUser(userEmailToEdit) {
    const users = getStoredUsers();
    const userToEdit = users[userEmailToEdit];

    if (!userToEdit) {
        showMessage(userManagementMessage, 'المستخدم غير موجود.', true);
        return;
    }

    const newName = prompt(`تعديل اسم المستخدم (${userToEdit.name}):`, userToEdit.name);
    if (newName === null) return; // User cancelled

    const newPassword = prompt(`تعديل كلمة مرور المستخدم (${userToEdit.email}):`, userToEdit.password);
    if (newPassword === null) return; // User cancelled

    userToEdit.name = newName.trim();
    userToEdit.password = newPassword.trim();

    setStoredUsers(users);
    showMessage(userManagementMessage, `تم تحديث بيانات المستخدم ${userToEdit.email} بنجاح.`, false);
    loadAdminUsers();
}

function deleteUser(userEmailToDelete) {
    if (confirm(`هل أنت متأكد من حذف المستخدم ${userEmailToDelete}؟ سيؤدي هذا أيضاً إلى حذف جميع رحلاته.`)) {
        const users = getStoredUsers();
        if (users[userEmailToDelete]) {
            delete users[userEmailToDelete];
            setStoredUsers(users);

            // Also delete their flights
            const allFlights = getStoredFlights();
            if (allFlights[userEmailToDelete]) {
                delete allFlights[userEmailToDelete];
                setStoredFlights(allFlights);
            }
            
            showMessage(userManagementMessage, `تم حذف المستخدم ${userEmailToDelete} وجميع رحلاته بنجاح.`, false);
            loadAdminUsers();
            loadAdminData(); // Refresh admin flight data as well
        } else {
            showMessage(userManagementMessage, 'المستخدم غير موجود.', true);
        }
    }
}


// --- Flights Page Logic (User) ---
function generateFlightForms(numForms) {
    if (!flightFormsContainer) return;
    flightFormsContainer.innerHTML = '';
    const flightFields = [
        { id: 'date', label: 'التاريخ', type: 'date', required: true },
        { id: 'fltNo', label: 'FLT.NO', type: 'text', placeholder: 'رقم الرحلة', required: true },
        { id: 'onChocksTime', label: 'ON chocks Time', type: 'time' },
        { id: 'openDoorTime', label: 'Open Door Time', type: 'time' },
        { id: 'startCleaningTime', label: 'Start Cleaning Time', type: 'time' },
        { id: 'completeCleaningTime', label: 'Complete Cleaning Time', type: 'time' },
        { id: 'readyBoardingTime', label: 'Ready Boarding Time', type: 'time' },
        { id: 'startBoardingTime', label: 'Start Boarding Time', type: 'time' },
        { id: 'completeBoardingTime', label: 'Complete Boarding Time', type: 'time' },
        { id: 'closeDoorTime', label: 'Close Door Time', type: 'time' },
        { id: 'offChocksTime', label: 'Off chocks Time', type: 'time' },
        { id: 'notes', label: 'الملاحظات', type: 'text', placeholder: 'ملاحظات إضافية' }
    ];

    for (let i = 0; i < numForms; i++) {
        const card = document.createElement('div');
        card.className = 'flight-card';
        card.innerHTML = `<h4>رحلة رقم ${i + 1}</h4>`;

        flightFields.forEach(field => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';
            const label = document.createElement('label');
            label.setAttribute('for', `flight${i + 1}-${field.id}`);
            label.textContent = field.label + (field.required ? ' *' : '');
            
            const input = document.createElement('input');
            input.setAttribute('type', field.type);
            input.setAttribute('id', `flight${i + 1}-${field.id}`);
            input.setAttribute('name', field.id);
            if (field.required) {
                input.setAttribute('required', 'true');
            }
            if (field.placeholder) {
                input.setAttribute('placeholder', field.placeholder);
            }
            if (field.type === 'date') {
                const today = new Date();
                input.value = today.toISOString().split('T')[0];
            }

            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            card.appendChild(inputGroup);
        });
        flightFormsContainer.appendChild(card);
    }
}

async function saveAllFlights() {
    const user = getLoggedInUser();
    if (!user || user.email === ADMIN_EMAIL) {
        showMessage(messageContainer, "خطأ: معلومات المستخدم غير متوفرة أو أنت مسؤول. يرجى تسجيل الدخول كمستخدم عادي.", true);
        return;
    }
    const userEmail = user.email;
    const userName = localStorage.getItem(`userName_${userEmail}`);
    if (!userName) {
        showMessage(messageContainer, "خطأ: اسم المستخدم غير متوفر. يرجى تسجيل الدخول مرة أخرى.", true);
        return;
    }

    const forms = flightFormsContainer.querySelectorAll('.flight-card');
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    
    let allFlights = getStoredFlights();
    if (!allFlights[userEmail]) allFlights[userEmail] = {};
    if (!allFlights[userEmail][currentYear]) allFlights[userEmail][currentYear] = {};
    if (!allFlights[userEmail][currentYear][currentMonth]) allFlights[userEmail][currentYear][currentMonth] = {};

    let flightsSavedCount = 0;

    for (const form of forms) {
        const inputs = form.querySelectorAll('input');
        const flightData = {
            id: generateUniqueId(), // Local unique ID for each flight
            userEmail: userEmail,
            userName: userName,
            timestamp: new Date().toISOString(), // ISO string for consistent sorting
        };
        let isFormEmpty = true;
        let isDateMissing = true;
        let isFltNoMissing = true;

        inputs.forEach(input => {
            const fieldId = input.name;
            const value = input.value.trim();
            
            if (fieldId === 'date' && value) {
                flightData[fieldId] = value;
                isDateMissing = false;
            } else if (fieldId === 'fltNo' && value) {
                flightData[fieldId] = value;
                isFltNoMissing = false;
                isFormEmpty = false;
            } else if (value) {
                flightData[fieldId] = value;
                isFormEmpty = false;
            } else {
                flightData[fieldId] = '';
            }
        });

        if (isFormEmpty) {
            continue;
        }
        if (isDateMissing) {
            showMessage(messageContainer, `الرحلة رقم ${Array.from(forms).indexOf(form) + 1}: حقل التاريخ إجباري.`, true);
            continue;
        }
        if (isFltNoMissing) {
            showMessage(messageContainer, `الرحلة رقم ${Array.from(forms).indexOf(form) + 1}: حقل FLT.NO إجباري.`, true);
            continue;
        }
        
        allFlights[userEmail][currentYear][currentMonth][flightData.id] = flightData;
        flightsSavedCount++;
        inputs.forEach(input => input.value = ''); // Clear inputs
        // Reset date input to today after clearing
        const dateInput = form.querySelector('input[name="date"]');
        if (dateInput) {
            const today = new Date();
            dateInput.value = today.toISOString().split('T')[0];
        }
    }

    if (flightsSavedCount > 0) {
        setStoredFlights(allFlights);
        showMessage(messageContainer, `تم حفظ ${flightsSavedCount} رحلة بنجاح!`, false);
        loadUserFlights(userEmail);
    } else {
        showMessage(messageContainer, 'لم يتم حفظ أي رحلات. يرجى ملء الحقول المطلوبة.', true);
    }
}

function loadUserFlights(userEmail) {
    if (!userPastFlightsTableBody) return;
    userPastFlightsTableBody.innerHTML = '';

    const allFlights = getStoredFlights();
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');

    const userFlightsForMonth = allFlights[userEmail]?.[currentYear]?.[currentMonth] || {};
    
    const flightsArray = Object.values(userFlightsForMonth).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ); // Sort by latest first

    if (flightsArray.length === 0) {
        const row = userPastFlightsTableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 13;
        cell.textContent = 'لا توجد رحلات سابقة لهذا الشهر.';
        cell.style.textAlign = 'center';
        cell.style.color = '#777';
        return;
    }

    flightsArray.forEach(flight => {
        const row = userPastFlightsTableBody.insertRow();
        row.dataset.flightId = flight.id; // Store local unique ID
        
        row.insertCell(0).textContent = flight.date || '';
        row.insertCell(1).textContent = flight.fltNo || '';
        row.insertCell(2).textContent = flight.onChocksTime || '';
        row.insertCell(3).textContent = flight.openDoorTime || '';
        row.insertCell(4).textContent = flight.startCleaningTime || '';
        row.insertCell(5).textContent = flight.completeCleaningTime || '';
        row.insertCell(6).textContent = flight.readyBoardingTime || '';
        row.insertCell(7).textContent = flight.startBoardingTime || '';
        row.insertCell(8).textContent = flight.completeBoardingTime || '';
        row.insertCell(9).textContent = flight.closeDoorTime || '';
        row.insertCell(10).textContent = flight.offChocksTime || '';
        row.insertCell(11).textContent = flight.notes || '';

        const actionsCell = row.insertCell(12);
        const exportBtn = document.createElement('button');
        exportBtn.className = 'export-btn small-btn'; // Add small-btn class if you want smaller buttons
        exportBtn.innerHTML = '<i class="fas fa-file-word"></i> تصدير';
        exportBtn.addEventListener('click', () => exportFlightToWord(flight));
        actionsCell.appendChild(exportBtn);
    });
}

// START OF UPDATED EXPORT FUNCTIONS

// Export single flight to DOCX
async function exportFlightToWord(flight) {
    try {
        await exportSingleFlightToDocx(flight);
        showMessage(messageContainer, 'تم تصدير الرحلة إلى ملف Word (DOCX) بنجاح!', false);
    } catch (error) {
        console.error("Error exporting single flight to DOCX:", error);
        showMessage(messageContainer, 'حدث خطأ أثناء تصدير الرحلة إلى Word.', true);
    }
}

// Export admin stats and all flights to DOCX
async function exportAdminDataToWord(type) {
    const selectedDate = filterMonthInput.value;
    if (!selectedDate) {
        alert("يرجى اختيار الشهر والسنة للفلترة قبل التصدير.");
        return;
    }
    const [year, month] = selectedDate.split('-');

    const allFlightsStored = getStoredFlights();
    const usersStored = getStoredUsers();
    
    try {
        if (type === 'stats') {
            let userFlightCounts = {};
            let totalFlights = 0;
            let allUsersMap = new Map();

            for (const email in usersStored) {
                allUsersMap.set(email, usersStored[email].name);
            }

            for (const userEmail in allFlightsStored) {
                const userFlightsByYear = allFlightsStored[userEmail];
                if (userFlightsByYear && userFlightsByYear[year] && userFlightsByYear[year][month]) {
                    const flightsForThisUserMonth = Object.values(userFlightsByYear[year][month]);
                    userFlightCounts[userEmail] = flightsForThisUserMonth.length;
                    totalFlights += flightsForThisUserMonth.length;
                } else {
                    userFlightCounts[userEmail] = 0;
                }
            }
            
            // Pass relevant data as a single object to the export function
            await exportAdminDataToDocx(type, { userFlightCounts, totalFlights, allUsersMap }, selectedDate, null);
            showMessage(messageContainer || userManagementMessage, 'تم تصدير الإحصائيات إلى ملف Word (DOCX) بنجاح!', false);

        } else if (type === 'allFlights') {
            const selectedUserEmail = filterUserSelect.value;
            let flightsToExport = [];

            if (selectedUserEmail === 'all') {
                for (const userEmail in allFlightsStored) {
                    if (allFlightsStored[userEmail]?.[year]?.[month]) {
                        flightsToExport = flightsToExport.concat(Object.values(allFlightsStored[userEmail][year][month]));
                    }
                }
            } else {
                if (allFlightsStored[selectedUserEmail]?.[year]?.[month]) {
                    flightsToExport = Object.values(allFlightsStored[selectedUserEmail][year][month]);
                }
            }

            flightsToExport.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            // Pass relevant data as a single object to the export function
            await exportAdminDataToDocx(type, { flightsToExport, usersStored }, selectedDate, selectedUserEmail);
            showMessage(messageContainer || userManagementMessage, 'تم تصدير الرحلات التفصيلية إلى ملف Word (DOCX) بنجاح!', false);
        }
    } catch (error) {
        console.error(`Error exporting admin data (${type}) to DOCX:`, error);
        showMessage(messageContainer || userManagementMessage, `حدث خطأ أثناء تصدير البيانات إلى Word.`, true);
    }
}
// END OF UPDATED EXPORT FUNCTIONS


// --- Admin Page Logic ---
function updateAdminStatsTitle(year, month) {
    if (!adminStatsTitle) return;
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "أيلول", "أكتوبر", "نوفمبر", "ديسمبر"];
    adminStatsTitle.textContent = `إحصائيات الشهر ${monthNames[parseInt(month) - 1]} لسنة ${year} لشعبة تنسيق الطائرات`;
}

async function loadAdminData() {
    if (!adminAllFlightsTableBody || !userStatsContainer || !totalFlightsCountSpan || !filterMonthInput || !filterUserSelect) return;

    adminAllFlightsTableBody.innerHTML = '';
    userStatsContainer.innerHTML = '';
    totalFlightsCountSpan.textContent = 'عدد الرحلات الكلي: 0';

    const selectedDate = filterMonthInput.value;
    if (!selectedDate) {
        showMessage(messageContainer, "يرجى اختيار الشهر والسنة للفلترة.", true); // Using a general message container if available
        return;
    }
    const [year, month] = selectedDate.split('-');

    updateAdminStatsTitle(year, month);

    const allFlightsStored = getStoredFlights();
    const usersStored = getStoredUsers();
    let allFlightsFiltered = [];
    let userFlightCounts = {}; // { userEmail: count, ... }
    let allUsersMap = new Map(); // { userEmail: userName }

    // Populate allUsersMap from stored users
    for (const email in usersStored) {
        allUsersMap.set(email, usersStored[email].name);
    }

    let currentTotalFlights = 0;

    for (const userEmail in allFlightsStored) {
        const userFlightsByYear = allFlightsStored[userEmail];
        if (userFlightsByYear && userFlightsByYear[year] && userFlightsByYear[year][month]) {
            const flightsForThisUserMonth = Object.values(userFlightsByYear[year][month]);
            
            userFlightCounts[userEmail] = flightsForThisUserMonth.length;
            currentTotalFlights += flightsForThisUserMonth.length;
            allFlightsFiltered = allFlightsFiltered.concat(flightsForThisUserMonth);
            
            // Ensure userName is in allUsersMap
            if (!allUsersMap.has(userEmail) && flightsForThisUserMonth.length > 0) {
                allUsersMap.set(userEmail, flightsForThisUserMonth[0].userName); // Use userName from first flight as fallback
            }
        } else {
            userFlightCounts[userEmail] = 0; // User has no flights for this month
        }
    }
    
    // Ensure admin user is accounted for in allUsersMap if needed
    if (!allUsersMap.has(ADMIN_EMAIL)) {
        allUsersMap.set(ADMIN_EMAIL, 'Admin');
    }

    populateUserFilter(allUsersMap);
    
    const selectedUserEmail = filterUserSelect.value;
    let flightsToDisplay = allFlightsFiltered;
    if (selectedUserEmail !== 'all') {
        flightsToDisplay = allFlightsFiltered.filter(flight => flight.userEmail === selectedUserEmail);
    }

    displayAdminFlights(flightsToDisplay, year, month);
    displayAdminStats(userFlightCounts, currentTotalFlights, allUsersMap);
}

function populateUserFilter(usersMap) {
    if (!filterUserSelect) return;
    filterUserSelect.innerHTML = '<option value="all">جميع المستخدمين</option>'; // Reset

    const sortedUsers = Array.from(usersMap.entries()).sort((a, b) => {
        const nameA = a[1] || '';
        const nameB = b[1] || '';
        return nameA.localeCompare(nameB);
    });

    sortedUsers.forEach(([email, name]) => {
        if (email === ADMIN_EMAIL) return; // Don't add admin to filter dropdown

        const option = document.createElement('option');
        option.value = email;
        option.textContent = name;
        filterUserSelect.appendChild(option);
    });
    // Restore previously selected user if any
    const lastSelectedUser = filterUserSelect.dataset.lastSelected || 'all';
    if (filterUserSelect.querySelector(`option[value="${lastSelectedUser}"]`)) {
        filterUserSelect.value = lastSelectedUser;
    } else {
        filterUserSelect.value = 'all'; // Default to 'all' if last selected user was deleted
    }
}

function displayAdminFlights(flights, year, month) {
    if (!adminAllFlightsTableBody) return;
    adminAllFlightsTableBody.innerHTML = '';
    
    flights.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.onChocksTime); // Combine date and time for better sorting
        const dateB = new Date(b.date + 'T' + b.onChocksTime);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
        }
        return (a.fltNo || '').localeCompare(b.fltNo || '');
    });

    if (flights.length === 0) {
        const row = adminAllFlightsTableBody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 14;
        cell.textContent = 'لا توجد رحلات لعرضها بالفلاتر المحددة.';
        cell.style.textAlign = 'center';
        cell.style.color = '#777';
        return;
    }

    flights.forEach(flight => {
        const row = adminAllFlightsTableBody.insertRow();
        row.dataset.flightId = flight.id;
        row.dataset.userEmail = flight.userEmail;
        row.dataset.flightYear = year;
        row.dataset.flightMonth = month;
        
        row.insertCell(0).textContent = flight.date || '';
        row.insertCell(1).textContent = flight.fltNo || '';
        row.insertCell(2).textContent = flight.onChocksTime || '';
        row.insertCell(3).textContent = flight.openDoorTime || '';
        row.insertCell(4).textContent = flight.startCleaningTime || '';
        row.insertCell(5).textContent = flight.completeCleaningTime || '';
        row.insertCell(6).textContent = flight.readyBoardingTime || '';
        row.insertCell(7).textContent = flight.startBoardingTime || '';
        row.insertCell(8).textContent = flight.completeBoardingTime || '';
        row.insertCell(9).textContent = flight.closeDoorTime || '';
        row.insertCell(10).textContent = flight.offChocksTime || '';
        row.insertCell(11).textContent = flight.notes || '';

        const actionsCell = row.insertCell(12);
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', () => editFlight(flight));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.addEventListener('click', () => deleteFlight(flight));

        const exportBtn = document.createElement('button');
        exportBtn.className = 'export-btn small-btn';
        exportBtn.innerHTML = '<i class="fas fa-file-word"></i>';
        exportBtn.addEventListener('click', () => exportFlightToWord(flight));
        
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(deleteBtn);
        actionsCell.appendChild(exportBtn);
    });
}

function displayAdminStats(userFlightCounts, totalFlights, allUsersMap) {
    if (!userStatsContainer || !totalFlightsCountSpan) return;

    userStatsContainer.innerHTML = '';
    totalFlightsCountSpan.textContent = `عدد الرحلات الكلي: ${totalFlights}`;

    const sortedUserEmails = Object.keys(userFlightCounts).sort((a, b) => {
        const nameA = allUsersMap.get(a) || '';
        const nameB = allUsersMap.get(b) || '';
        return nameA.localeCompare(nameB);
    });

    for (const userEmail of sortedUserEmails) {
        if (userEmail === ADMIN_EMAIL) return; // Don't show admin stats here

        const userName = allUsersMap.get(userEmail) || `المستخدم (${userEmail.split('@')[0]})`;
        const count = userFlightCounts[userEmail];

        const statCard = document.createElement('div');
        statCard.className = 'user-stat-card';
        statCard.innerHTML = `<h4>${userName}</h4><p>${count}</p>`;
        userStatsContainer.appendChild(statCard);
    }
}

function editFlight(flight) {
    const allFlights = getStoredFlights();
    const flightToEdit = allFlights[flight.userEmail]?.[flight.date.substring(0, 4)]?.[flight.date.substring(5, 7)]?.[flight.id];

    if (!flightToEdit) {
        showMessage(messageContainer || userManagementMessage, 'الرحلة غير موجودة للتعديل.', true);
        return;
    }

    const flightFields = [
        { id: 'date', label: 'التاريخ', type: 'date' },
        { id: 'fltNo', label: 'FLT.NO', type: 'text' },
        { id: 'onChocksTime', label: 'ON chocks Time', type: 'time' },
        { id: 'openDoorTime', label: 'Open Door Time', type: 'time' },
        { id: 'startCleaningTime', label: 'Start Cleaning Time', type: 'time' },
        { id: 'completeCleaningTime', label: 'Complete Cleaning Time', type: 'time' },
        { id: 'readyBoardingTime', label: 'Ready Boarding Time', type: 'time' },
        { id: 'startBoardingTime', label: 'Start Boarding Time', type: 'time' },
        { id: 'completeBoardingTime', label: 'Complete Boarding Time', type: 'time' },
        { id: 'closeDoorTime', label: 'Close Door Time', type: 'time' },
        { id: 'offChocksTime', label: 'Off chocks Time', type: 'time' },
        { id: 'notes', label: 'ملاحظات', type: 'text' }
    ];

    let updatedData = {};
    let cancelled = false;
    for (const field of flightFields) {
        const newValue = prompt(`تعديل ${field.label}:`, flightToEdit[field.id] || '');
        if (newValue !== null) {
            updatedData[field.id] = newValue;
        } else {
            cancelled = true;
            break;
        }
    }

    if (cancelled) return;

    // Preserve original userEmail, userName, id, timestamp
    const finalUpdatedFlight = {
        ...flightToEdit,
        ...updatedData,
        // Ensure that date change also reflects in storage path for admin view
        // If date changes, it means the flight might move to a different month/year bucket
        // For simplicity with localStorage, we'll keep it in the original month's bucket
        // or re-save it to the new bucket and delete old. For now, we'll assume minor edits.
    };

    // If date or month/year changes, it complicates local storage path.
    // For local storage, if date changes and consequently month/year, we need to move it.
    const oldYear = flight.date.substring(0, 4);
    const oldMonth = flight.date.substring(5, 7);
    const newYear = updatedData.date ? updatedData.date.substring(0, 4) : oldYear;
    const newMonth = updatedData.date ? updatedData.date.substring(5, 7) : oldMonth;

    if (oldYear !== newYear || oldMonth !== newMonth) {
        // Complex scenario: flight moving to a different month/year bucket
        // Remove from old location
        if (allFlights[flight.userEmail]?.[oldYear]?.[oldMonth]?.[flight.id]) {
            delete allFlights[flight.userEmail][oldYear][oldMonth][flight.id];
            if (Object.keys(allFlights[flight.userEmail][oldYear][oldMonth]).length === 0) {
                delete allFlights[flight.userEmail][oldYear][oldMonth];
            }
            if (Object.keys(allFlights[flight.userEmail][oldYear]).length === 0) {
                delete allFlights[flight.userEmail][oldYear];
            }
        }
        // Add to new location
        if (!allFlights[flight.userEmail]) allFlights[flight.userEmail] = {};
        if (!allFlights[flight.userEmail][newYear]) allFlights[flight.userEmail][newYear] = {};
        if (!allFlights[flight.userEmail][newYear][newMonth]) allFlights[flight.userEmail][newYear][newMonth] = {};
        
        allFlights[flight.userEmail][newYear][newMonth][flight.id] = finalUpdatedFlight;

    } else {
        // Same month/year, just update in place
        allFlights[flight.userEmail][oldYear][oldMonth][flight.id] = finalUpdatedFlight;
    }

    setStoredFlights(allFlights);
    showMessage(messageContainer || userManagementMessage, 'تم تحديث الرحلة بنجاح!', false);
    loadAdminData(); // Reload admin data to show changes
}

function deleteFlight(flight) {
    if (confirm("هل أنت متأكد من حذف هذه الرحلة؟")) {
        const allFlights = getStoredFlights();
        const year = flight.date.substring(0, 4);
        const month = flight.date.substring(5, 7);

        if (allFlights[flight.userEmail]?.[year]?.[month]?.[flight.id]) {
            delete allFlights[flight.userEmail][year][month][flight.id];
            
            // Clean up empty month/year/user objects
            if (Object.keys(allFlights[flight.userEmail][year][month]).length === 0) {
                delete allFlights[flight.userEmail][year][month];
            }
            if (Object.keys(allFlights[flight.userEmail][year]).length === 0) {
                delete allFlights[flight.userEmail][year];
            }
            // No need to delete user object, as user object is separate in USERS_STORAGE_KEY

            setStoredFlights(allFlights);
            showMessage(messageContainer || userManagementMessage, 'تم حذف الرحلة بنجاح!', false);
            loadAdminData();
        } else {
            showMessage(messageContainer || userManagementMessage, 'الرحلة غير موجودة للحذف.', true);
        }
    }
}