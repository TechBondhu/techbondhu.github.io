/**
 * Combined chat functionality for handling Firebase, chat history, and UI interactions.
 * Merged from script.js and chatHistory.js, with duplicates removed and code optimized.
 * Updated to target the application side (left column) in the split chat setup.
 */

// Firebase SDK Check
if (typeof firebase === 'undefined') throw new Error("Firebase SDK not loaded. Add Firebase CDN in index.html");

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCoIdMx9Zd7kQt9MSZmowbphaQVRl8D16E",
    authDomain: "admissionformdb.firebaseapp.com",
    projectId: "admissionformdb",
    storageBucket: "admissionformdb.appspot.com",
    messagingSenderId: "398052082157",
    appId: "1:398052082157:web:0bc02d66cbdf55dd2567e4"
};

// Initialize Firebase
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Global Variables
let currentChatId = localStorage.getItem('currentChatId') || null;
let currentUserUid = null;
let selectedFile = null;
let editedImage = null;

// DOM Elements (Updated for application side)
const elements = {
    sidebar: document.getElementById('sidebar'),
    historyList: document.getElementById('historyList'),
    historyIcon: document.getElementById('historyIcon'),
    closeSidebar: document.getElementById('closeSidebar'),
    newChatIcon: document.getElementById('newChatIcon'),
    searchInput: document.getElementById('searchInput'),
    deleteModal: document.getElementById('deleteModal'),
    renameModal: document.getElementById('renameModal'),
    cancelDelete: document.getElementById('cancelDelete'),
    confirmDelete: document.getElementById('confirmDelete'),
    cancelRename: document.getElementById('cancelRename'),
    saveRename: document.getElementById('saveRename'),
    renameInput: document.getElementById('renameInput'),
    messagesDiv: document.getElementById('application-messages'), // Updated
    welcomeMessage: document.getElementById('welcomeMessageApplication'), // Updated
    userInput: document.getElementById('userInputApplication'), // Updated
    sendBtn: document.getElementById('sendBtnApplication'), // Updated
    uploadBtn: document.getElementById('uploadBtnApplication'), // Updated
    fileInput: document.getElementById('fileInputApplication'), // Updated
    previewContainer: document.getElementById('previewContainerApplication'), // Updated
    previewImage: document.getElementById('previewImageApplication'), // Updated
    editModal: document.getElementById('editModal'),
    editCanvas: document.getElementById('editCanvas'),
    cropX: document.getElementById('cropX'),
    cropY: document.getElementById('cropY'),
    cropWidth: document.getElementById('cropWidth'),
    cropHeight: document.getElementById('cropHeight'),
    brightness: document.getElementById('brightness'),
    contrast: document.getElementById('contrast'),
    backgroundColor: document.getElementById('bgColor'),
    editCancelBtn: document.getElementById('cancelEdit'),
    editApplyBtn: document.getElementById('editApplyBtn'),
    moreOptionsBtn: document.getElementById('moreOptionsBtnApplication'), // Updated
    genresModal: document.getElementById('genresModal'),
    closeGenresModal: document.getElementById('closeGenresModal'),
    genresList: document.getElementById('genresList'),
    imageReviewModal: document.getElementById('imageReviewModal'),
    reviewImage: document.getElementById('reviewImage'),
    deleteImageBtn: document.getElementById('deleteImageBtn')
};

// Image Editing State
const cropRect = { x: 0, y: 0, width: 200, height: 200 };
let brightnessValue = 0;
let contrastValue = 0;
let bgColor = 'white';
const ctx = elements.editCanvas?.getContext('2d');
const image = new Image();

   // Genres Data
const genres = [
    { name: 'এনআইডি আবেদন', icon: 'fas fa-id-card', message: 'আমার জন্য একটি এনআইডি তৈরি করতে চাই' },
    { name: 'পাসপোর্ট আবেদন', icon: 'fas fa-passport', message: 'আমি পাসপোর্ট আবেদন করতে চাই' },
    { name: 'কোম্পানি রেজিস্ট্রেশন', icon: 'fas fa-building', message: 'আমি কোম্পানি রেজিস্ট্রেশন করতে চাই' },
    { name: 'পেনশন আবেদন ফর্ম', icon: 'fas fa-money-check-alt', message: 'আমি পেনশন আবেদন করতে চাই' },
    { name: 'টিআইএন (TIN) সার্টিফিকেট আবেদন', icon: 'fas fa-file-invoice', message: 'আমি টিআইএন সার্টিফিকেট আবেদন করতে চাই' },
    { name: 'ভূমি নামজারি (Mutation) আবেদনপত্র', icon: 'fas fa-map-marked-alt', message: 'আমি ভূমি নামজারি আবেদন করতে চাই' },
    { name: 'উপবৃত্তি বা শিক্ষাবৃত্তির আবেদন', icon: 'fas fa-graduation-cap', message: 'আমি উপবৃত্তি বা শিক্ষাবৃত্তির আবেদন করতে চাই' },
    { name: 'জন্ম ও মৃত্যু নিবন্ধন', icon: 'fas fa-certificate', message: 'আমি জন্ম ও মৃত্যু নিবন্ধন করতে চাই' },
    { name: 'ড্রাইভিং লাইসেন্স আবেদন', icon: 'fas fa-car', message: 'আমি ড্রাইভিং লাইসেন্স আবেদন করতে চাই' },
    { name: 'নাগরিক সনদ (Citizen Certificate) আবেদন', icon: 'fas fa-user-check', message: 'আমি নাগরিক সনদ আবেদন করতে চাই' },
    { name: 'চারিত্রিক সনদপত্র (Character Certificate) আবেদন', icon: 'fas fa-award', message: 'আমি চারিত্রিক সনদপত্র আবেদন করতে চাই' },
    { name: 'ট্রেড লাইসেন্স', icon: 'fas fa-store', message: 'আমি ট্রেড লাইসেন্স আবেদন করতে চাই' },
    { name: 'ভ্যাট রেজিস্ট্রেশন', icon: 'fas fa-calculator', message: 'আমি ভ্যাট রেজিস্ট্রেশন করতে চাই' },
    { name: 'প্রপার্টি রেজিস্ট্রেশন', icon: 'fas fa-home', message: 'আমি প্রপার্টি রেজিস্ট্রেশন করতে চাই' },
    { name: 'ব্যাংক অ্যাকাউন্ট খোলা', icon: 'fas fa-university', message: 'আমি ব্যাংক অ্যাকাউন্ট খুলতে চাই' },
    { name: 'ঢাকা বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি ঢাকা বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'খুলনা বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি খুলনা বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'রাজশাহী বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি রাজশাহী বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'চট্টগ্রাম বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি চট্টগ্রাম বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি জাহাঙ্গীরনগর বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি বাংলাদেশ কৃষি বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'জগন্নাথ বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি জগন্নাথ বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'কুমিল্লা বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি কুমিল্লা বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'বরিশাল বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি বরিশাল বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'নোয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি নোয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি হাজী মোহাম্মদ দানেশ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'মাওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি মাওলানা ভাসানী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'পটুয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি পটুয়াখালী বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'ইসলামী বিশ্ববিদ্যালয় ভর্তি আবেদন', icon: 'fas fa-university', message: 'আমি ইসলামী বিশ্ববিদ্যালয় ভর্তি আবেদন করতে চাই' },
    { name: 'গ্যাস সংযোগ আবেদন', icon: 'fas fa-fire', message: 'আমি গ্যাস সংযোগ আবেদন করতে চাই' },
    { name: 'বিদ্যুৎ সংযোগ আবেদন', icon: 'fas fa-bolt', message: 'আমি বিদ্যুৎ সংযোগ আবেদন করতে চাই' },
    { name: 'পানি সংযোগ আবেদন', icon: 'fas fa-faucet', message: 'আমি পানি সংযোগ আবেদন করতে চাই' },
    { name: 'জমির খতিয়ান সংশোধন', icon: 'fas fa-file-alt', message: 'আমি জমির খতিয়ান সংশোধন করতে চাই' },
    { name: 'ভূমি উন্নয়ন কর পরিশোধ', icon: 'fas fa-money-bill', message: 'আমি ভূমি উন্নয়ন কর পরিশোধ করতে চাই' },
    { name: 'ইমিগ্রেশন ক্লিয়ারেন্স', icon: 'fas fa-plane-departure', message: 'আমি ইমিগ্রেশন ক্লিয়ারেন্সের জন্য আবেদন করতে চাই' },
    { name: 'ওয়ারিশ সনদ আবেদন', icon: 'fas fa-users', message: 'আমি ওয়ারিশ সনদ আবেদন করতে চাই' },
    { name: 'পৌরসভা সেবা আবেদন', icon: 'fas fa-city', message: 'আমি পৌরসভা সেবা আবেদন করতে চাই' },
    { name: 'বন্ধকী জমি রেজিস্ট্রেশন', icon: 'fas fa-handshake', message: 'আমি বন্ধকী জমি রেজিস্ট্রেশন করতে চাই' },
    { name: 'বিবাহ নিবন্ধন আবেদন', icon: 'fas fa-ring', message: 'আমি বিবাহ নিবন্ধন করতে চাই' },
    { name: 'তালাক নিবন্ধন আবেদন', icon: 'fas fa-heart-broken', message: 'আমি তালাক নিবন্ধন করতে চাই' },
    { name: 'জাতীয় পেনশন স্কিমে যোগদান', icon: 'fas fa-piggy-bank', message: 'আমি জাতীয় পেনশন স্কিমে যোগ দিতে চাই' },
    { name: 'পরিবেশ ছাড়পত্র আবেদন', icon: 'fas fa-leaf', message: 'আমি পরিবেশ ছাড়পত্র আবেদন করতে চাই' },
    { name: 'ফায়ার সেফটি সার্টিফিকেট', icon: 'fas fa-fire-extinguisher', message: 'আমি ফায়ার সেফটি সার্টিফিকেট আবেদন করতে চাই' },
    { name: 'বিল্ডিং প্ল্যান অনুমোদন', icon: 'fas fa-drafting-compass', message: 'আমি বিল্ডিং প্ল্যান অনুমোদনের জন্য আবেদন করতে চাই' },
    { name: 'সরকারি চাকরি আবেদন', icon: 'fas fa-briefcase', message: 'আমি সরকারি চাকরির জন্য আবেদন করতে চাই' },
    { name: 'প্রবাসী কল্যাণ সেবা আবেদন', icon: 'fas fa-globe', message: 'আমি প্রবাসী কল্যাণ সেবা আবেদন করতে চাই' },
    { name: 'হজ ভিসা আবেদন', icon: 'fas fa-kaaba', message: 'আমি হজ ভিসা আবেদন করতে চাই' },
    { name: 'পেশাদার লাইসেন্স (ডাক্তার/ইঞ্জিনিয়ার)', icon: 'fas fa-stethoscope', message: 'আমি পেশাদার লাইসেন্স (ডাক্তার/ইঞ্জিনিয়ার) আবেদন করতে চাই' },
    { name: 'সরকারি অনুদান আবেদন', icon: 'fas fa-hand-holding-usd', message: 'আমি সরকারি অনুদান আবেদন করতে চাই' },
    { name: 'সেনাবাহিনী চাকরি', icon: 'fas fa-shield-alt', message: 'আমি সেনাবাহিনী চাকরির জন্য আবেদন করতে চাই' },
    { name: 'পুলিশ চাকরি', icon: 'fas fa-badge-police', message: 'আমি পুলিশ চাকরির জন্য আবেদন করতে চাই' },
    // Add more genres as needed
];

// Utility Functions
function sanitizeMessage(message) {
    const div = document.createElement('div');
    div.textContent = message;
    return div.innerHTML;
}

function showErrorMessage(message) {
    displayMessage(`⚠️ ${message}`, 'bot');
    saveChatHistory(`⚠️ ${message}`, 'bot');
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    elements.messagesDiv?.appendChild(typingDiv);
    elements.messagesDiv?.scrollTo({ top: elements.messagesDiv.scrollHeight, behavior: 'smooth' });
    return typingDiv;
}

function hideWelcomeMessage() {
    if (elements.welcomeMessage) {
        elements.welcomeMessage.classList.add('fade-out');
        setTimeout(() => elements.welcomeMessage.style.display = 'none', 300);
    }
}

// Display Message
function displayMessage(message, sender) {
    if (!elements.messagesDiv) return;
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageDiv.innerHTML = sanitizeMessage(message);
    elements.messagesDiv.appendChild(messageDiv);
    elements.messagesDiv.scrollTo({ top: elements.messagesDiv.scrollHeight, behavior: 'smooth' });
}

// Save Chat History
function saveChatHistory(message, sender) {
    if (!currentUserUid || !currentChatId) return;
    db.collection('users').doc(currentUserUid).collection('chats').doc(currentChatId).collection('messages').add({
        message: sanitizeMessage(message),
        sender,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(error => showErrorMessage('হিস্ট্রি সংরক্ষণে সমস্যা: ' + error.message));
}

// Load Chat History
function loadChatHistory(searchTerm = '') {
    if (!currentUserUid) return;
    elements.historyList.innerHTML = '';
    let query = db.collection('users').doc(currentUserUid).collection('chats').orderBy('timestamp', 'desc');
    if (searchTerm) {
        query = query.where('title', '>=', searchTerm).where('title', '<=', searchTerm + '\uf8ff');
    }
    query.get().then(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.setAttribute('data-id', doc.id);
            historyItem.innerHTML = `
                <div class="history-item-content">
                    <p>${sanitizeMessage(data.title)}</p>
                    <div class="timestamp">${new Date(data.timestamp?.toDate()).toLocaleString()}</div>
                </div>
                <div class="options">
                    <i class="fas fa-edit" data-action="rename"></i>
                    <i class="fas fa-trash" data-action="delete"></i>
                </div>
            `;
            historyItem.addEventListener('click', e => {
                if (e.target.classList.contains('fa-edit') || e.target.classList.contains('fa-trash')) return;
                currentChatId = doc.id;
                localStorage.setItem('currentChatId', doc.id);
                loadMessages(doc.id);
            });
            historyItem.querySelector('.fa-edit')?.addEventListener('click', () => {
                elements.renameInput.value = data.title;
                elements.renameModal.setAttribute('data-id', doc.id);
                elements.renameModal.style.display = 'flex';
            });
            historyItem.querySelector('.fa-trash')?.addEventListener('click', () => {
                elements.deleteModal.setAttribute('data-id', doc.id);
                elements.deleteModal.style.display = 'flex';
            });
            elements.historyList.appendChild(historyItem);
        });
    }).catch(error => showErrorMessage('হিস্ট্রি লোডে সমস্যা: ' + error.message));
}

// Load Messages
function loadMessages(chatId) {
    elements.messagesDiv.innerHTML = '';
    if (!currentUserUid || !chatId) return;
    db.collection('users').doc(currentUserUid).collection('chats').doc(chatId).collection('messages')
        .orderBy('timestamp').get().then(snapshot => {
            snapshot.forEach(doc => {
                const data = doc.data();
                displayMessage(data.message, data.sender);
            });
        }).catch(error => showErrorMessage('মেসেজ লোডে সমস্যা: ' + error.message));
}

// Start New Chat
function startNewChat() {
    if (!currentUserUid) return;
    const title = 'নতুন চ্যাট';
    db.collection('users').doc(currentUserUid).collection('chats').add({
        title,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(docRef => {
        currentChatId = docRef.id;
        localStorage.setItem('currentChatId', docRef.id);
        elements.messagesDiv.innerHTML = '';
        loadChatHistory();
        elements.welcomeMessage.style.display = 'block';
        elements.welcomeMessage.classList.remove('fade-out');
    }).catch(error => showErrorMessage('নতুন চ্যাট শুরুতে সমস্যা: ' + error.message));
}

// Delete Chat
function deleteChat() {
    const chatId = elements.deleteModal.getAttribute('data-id');
    if (!currentUserUid || !chatId) return;
    db.collection('users').doc(currentUserUid).collection('chats').doc(chatId).delete()
        .then(() => {
            elements.deleteModal.style.display = 'none';
            if (currentChatId === chatId) {
                currentChatId = null;
                localStorage.removeItem('currentChatId');
                elements.messagesDiv.innerHTML = '';
                elements.welcomeMessage.style.display = 'block';
                elements.welcomeMessage.classList.remove('fade-out');
            }
            loadChatHistory();
        }).catch(error => showErrorMessage('চ্যাট মুছতে সমস্যা: ' + error.message));
}

// Rename Chat
function renameChat() {
    const chatId = elements.renameModal.getAttribute('data-id');
    const newTitle = elements.renameInput.value.trim();
    if (!currentUserUid || !chatId || !newTitle) return;
    db.collection('users').doc(currentUserUid).collection('chats').doc(chatId).update({
        title: newTitle
    }).then(() => {
        elements.renameModal.style.display = 'none';
        loadChatHistory();
    }).catch(error => showErrorMessage('চ্যাটের নাম পরিবর্তনে সমস্যা: ' + error.message));
}

// Toggle Sidebar
function toggleSidebar() {
    if (elements.sidebar.classList.contains('open')) {
        elements.sidebar.classList.remove('open');
        document.querySelector('.chat-container')?.classList.remove('sidebar-open');
    } else {
        elements.sidebar.classList.add('open');
        document.querySelector('.chat-container')?.classList.add('sidebar-open');
        loadChatHistory();
    }
}

function closeSidebarHandler() {
    elements.sidebar.classList.remove('open');
    document.querySelector('.chat-container')?.classList.remove('sidebar-open');
}

// Send Message
function sendMessage() {
    const message = elements.userInput.value.trim();
    if (!message && !selectedFile) return;
    if (!currentChatId) startNewChat();
    displayMessage(message, 'user');
    saveChatHistory(message, 'user');
    elements.userInput.value = '';
    if (selectedFile) {
        const reader = new FileReader();
        reader.onload = e => {
            const imgSrc = editedImage || e.target.result;
            displayMessage(`<img src="${imgSrc}" class="image-preview" />`, 'user');
            saveChatHistory('ইমেজ আপলোড করা হয়েছে', 'user');
            callRasaAPI('show_review');
            clearPreview();
        };
        reader.onerror = () => showErrorMessage('ইমেজ লোডে সমস্যা।');
        reader.readAsDataURL(selectedFile);
    } else {
        callRasaAPI(message);
    }
    hideWelcomeMessage();
}

// Display Review
function displayReview(reviewData) {
    const reviewCard = document.createElement('div');
    reviewCard.classList.add('review-card');
    reviewCard.setAttribute('data-editable', 'false');
    const reviewContent = document.createElement('div');
    reviewContent.classList.add('review-content');
    reviewContent.innerHTML = '<h3>আবেদনের তথ্য পর্যালোচনা</h3>';
    Object.entries(reviewData).forEach(([key, value]) => {
        if (key === 'form_type') return;
        const item = document.createElement('div');
        item.classList.add('review-item');
        item.setAttribute('data-key', key);
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
        item.innerHTML = `<label>${sanitizeMessage(label)}:</label><p>${sanitizeMessage(value)}</p>`;
        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image'))) {
            item.innerHTML = `<label>${sanitizeMessage(label)}:</label><img src="${value}" /><i class="fas fa-camera replace-image-icon"></i>`;
        }
        reviewContent.appendChild(item);
    });
    const reviewButtons = document.createElement('div');
    reviewButtons.classList.add('review-buttons');
    reviewButtons.innerHTML = `
        <button class="edit-btn">Edit</button>
        <button class="confirm-btn">Confirm</button>
        <button class="download-btn">Download PDF</button>
    `;
    reviewCard.appendChild(reviewContent);
    reviewCard.appendChild(reviewButtons);
    elements.messagesDiv.appendChild(reviewCard);
    elements.messagesDiv.scrollTo({ top: elements.messagesDiv.scrollHeight, behavior: 'smooth' });

    reviewButtons.querySelector('.edit-btn').addEventListener('click', () => toggleEditReview(reviewData, reviewCard));
    reviewButtons.querySelector('.confirm-btn').addEventListener('click', () => generatePDF(reviewData, reviewCard));
    reviewButtons.querySelector('.download-btn').addEventListener('click', () => {
        const pdfUrl = reviewCard.getAttribute('data-pdf-url');
        if (pdfUrl) {
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = 'application.pdf';
            a.click();
        } else {
            showErrorMessage('PDF উপলব্ধ নয়। প্রথমে Confirm করুন।');
        }
    });
    reviewContent.querySelectorAll('.replace-image-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.classList.add('replace-image-input');
            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = e => {
                        const img = icon.parentElement.querySelector('img');
                        img.src = e.target.result;
                        reviewData[icon.parentElement.getAttribute('data-key')] = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
            fileInput.click();
        });
    });
}

// Toggle Edit Review
function toggleEditReview(reviewData, reviewCard) {
    const reviewContent = reviewCard.querySelector('.review-content');
    const editBtn = reviewCard.querySelector('.edit-btn');
    const confirmBtn = reviewCard.querySelector('.confirm-btn');
    if (reviewCard.getAttribute('data-editable') === 'false') {
        reviewCard.setAttribute('data-editable', 'true');
        editBtn.textContent = 'Save';
        confirmBtn.style.display = 'none';
        reviewContent.querySelectorAll('.review-item').forEach(item => {
            const key = item.getAttribute('data-key');
            const value = reviewData[key];
            item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label>`;
            if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image'))) {
                const img = document.createElement('img');
                img.src = value;
                item.appendChild(img);
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.classList.add('replace-image-input');
                fileInput.addEventListener('change', () => {
                    const file = fileInput.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = e => img.src = e.target.result;
                        reader.readAsDataURL(file);
                    }
                });
                item.appendChild(fileInput);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = value || '';
                input.classList.add('edit-input');
                item.appendChild(input);
            }
        });
    } else {
        const updatedData = { ...reviewData };
        reviewContent.querySelectorAll('.review-item').forEach(item => {
            const key = item.getAttribute('data-key');
            const input = item.querySelector('input.edit-input');
            const img = item.querySelector('img');
            if (input) {
                const newValue = input.value.trim();
                updatedData[key] = newValue;
                item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label><p>${sanitizeMessage(newValue)}</p>`;
            } else if (img) {
                updatedData[key] = img.src;
                item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label><img src="${img.src}" /><i class="fas fa-camera replace-image-icon"></i>`;
            }
        });
        reviewCard.setAttribute('data-editable', 'false');
        editBtn.textContent = 'Edit';
        confirmBtn.style.display = 'inline-block';
        Object.assign(reviewData, updatedData);
    }
}

// Generate PDF
function generatePDF(reviewData, reviewCard) {
    const formType = reviewData.form_type || 'generic';
    const payload = {
        reviewData: Object.fromEntries(
            Object.entries(reviewData).map(([key, value]) => [
                key,
                typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image')) ? '[Image]' : value
            ])
        ),
        formType
    };
    fetch('http://localhost:5000/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            if (data.pdf_url) {
                reviewCard.setAttribute('data-pdf-url', data.pdf_url);
                displayMessage('PDF তৈরি ও আপলোড সফল!');
                saveChatHistory('PDF তৈরি সফল।', 'bot');
            } else {
                throw new Error(data.error || 'PDF generation failed');
            }
        })
        .catch(error => {
            showErrorMessage('PDF তৈরিতে সমস্যা: ' + error.message);
            saveChatHistory('PDF error: ' + error.message, 'bot');
        });
}

// Call Rasa API
function callRasaAPI(message, metadata = {}) {
    const typingDiv = showTypingIndicator();
    const payload = { sender: currentChatId || 'default', message, ...metadata };
    setTimeout(() => {
        if (typeof $ === 'undefined') {
            typingDiv.remove();
            showErrorMessage('jQuery লোড হয়নি।');
            return;
        }
        $.ajax({
            url: 'http://localhost:5005/webhooks/rest/webhook',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: data => {
                typingDiv.remove();
                if (!data || !data.length) {
                    showErrorMessage('কোনো সাড়া পাওয়া যায়নি।');
                    saveChatHistory('কোনো সাড়া পাওয়া যায়নি।', 'bot');
                    return;
                }
                data.forEach(response => {
                    if (response.text && !response.text.toLowerCase().includes('hi')) {
                        displayMessage(sanitizeMessage(response.text), 'bot');
                        saveChatHistory(sanitizeMessage(response.text), 'bot');
                    }
                    if (response.custom?.review_data) {
                        displayReview(response.custom.review_data);
                    }
                    if (response.buttons) {
                        const buttonDiv = document.createElement('div');
                        buttonDiv.classList.add('welcome-buttons');
                        response.buttons.forEach(btn => {
                            const button = document.createElement('button');
                            button.textContent = sanitizeMessage(btn.title);
                            button.classList.add('ripple-btn');
                            button.addEventListener('click', () => sendMessage(btn.payload));
                            buttonDiv.appendChild(button);
                        });
                        elements.messagesDiv?.appendChild(buttonDiv);
                    }
                });
            },
            error: () => {
                typingDiv.remove();
                showErrorMessage('বট সংযোগে সমস্যা।');
                saveChatHistory('বট সংযোগে সমস্যা।', 'bot');
            }
        });
    }, 500);
}

// Image Handling Functions
function clearPreview() {
    selectedFile = null;
    editedImage = null;
    if (elements.previewImage) elements.previewImage.src = '';
    if (elements.previewContainer) elements.previewContainer.style.display = 'none';
}

function openImageModal(src) {
    if (elements.reviewImage) elements.reviewImage.src = src;
    if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'block';
}

function drawImage() {
    if (!ctx) return;
    ctx.clearRect(0, 0, elements.editCanvas.width, elements.editCanvas.height);
    ctx.fillStyle = bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor;
    ctx.fillRect(0, 0, elements.editCanvas.width, elements.editCanvas.height);
    ctx.filter = `brightness(${100 + brightnessValue}%) contrast(${100 + contrastValue}%)`;
    ctx.drawImage(image, 0, 0);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
    ctx.filter = 'none';
}

// Genres Modal Functions
function renderGenres() {
    if (!elements.genresList) return;
    elements.genresList.innerHTML = '';
    genres.forEach(genre => {
        const item = document.createElement('div');
        item.className = 'genre-item ripple-btn';
        item.innerHTML = `<i class="${genre.icon}"></i><span>${sanitizeMessage(genre.name)}</span>`;
        item.addEventListener('click', () => {
            elements.genresModal?.classList.add('slide-out');
            setTimeout(() => {
                elements.genresModal.style.display = 'none';
                elements.genresModal.classList.remove('slide-out');
            }, 300);
            if (genre.message) {
                displayMessage(sanitizeMessage(genre.message), 'user');
                saveChatHistory(sanitizeMessage(genre.message), 'user');
                callRasaAPI(genre.message);
                hideWelcomeMessage();
            } else {
                showErrorMessage('এই সেবা উপলব্ধ নয়।');
            }
        });
        elements.genresList.appendChild(item);
    });
}

function openGenresModal() {
    renderGenres();
    elements.genresModal?.classList.add('slide-in');
    elements.genresModal.style.display = 'block';
    setTimeout(() => elements.genresModal?.classList.remove('slide-in'), 300);
}

function closeGenresModal() {
    elements.genresModal?.classList.add('slide-out');
    setTimeout(() => {
        elements.genresModal.style.display = 'none';
        elements.genresModal.classList.remove('slide-out');
    }, 300);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Authentication
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserUid = user.uid;
            loadChatHistory();
            if (currentChatId) {
                loadMessages(currentChatId);
            } else {
                startNewChat(); // Automatically start a new chat if none exists
            }
        } else {
            auth.signInAnonymously().catch(error => showErrorMessage('Authentication error: ' + error.message));
        }
    });

    // Chat History Handlers
    elements.historyIcon?.addEventListener('click', toggleSidebar);
    elements.closeSidebar?.addEventListener('click', closeSidebarHandler);
    elements.newChatIcon?.addEventListener('click', startNewChat);
    elements.searchInput?.addEventListener('input', () => loadChatHistory(elements.searchInput.value.trim()));
    elements.cancelDelete?.addEventListener('click', () => elements.deleteModal.style.display = 'none');
    elements.confirmDelete?.addEventListener('click', deleteChat);
    elements.cancelRename?.addEventListener('click', () => elements.renameModal.style.display = 'none');
    elements.saveRename?.addEventListener('click', renameChat);

    // Message Sending
    elements.sendBtn?.addEventListener('click', sendMessage);
    elements.userInput?.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.repeat) sendMessage();
    });

    // Image Upload
    elements.uploadBtn?.addEventListener('click', () => elements.fileInput?.click());
    elements.fileInput?.addEventListener('change', () => {
        const file = elements.fileInput.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = e => {
                elements.previewImage.src = e.target.result;
                elements.previewContainer.style.display = 'block';
            };
            reader.onerror = () => showErrorMessage('ইমেজ লোডে সমস্যা।');
            reader.readAsDataURL(file);
        }
        elements.fileInput.value = '';
    });

    // Image Review
    elements.previewImage?.addEventListener('click', () => {
        elements.reviewImage.src = elements.previewImage.src;
        elements.imageReviewModal.style.display = 'block';
    });

    // Image Editing
    elements.previewImage?.addEventListener('dblclick', () => {
        image.src = elements.previewImage.src || '';
        image.onload = () => {
            if (elements.editCanvas) {
                elements.editCanvas.width = image.width;
                elements.editCanvas.height = image.height;
                cropRect.width = Math.min(200, image.width);
                cropRect.height = Math.min(200, image.height);
                drawImage();
                elements.editModal.style.display = 'block';
            }
        };
    });

    // Canvas Controls
    elements.cropX?.addEventListener('input', e => { cropRect.x = parseInt(e.target.value); drawImage(); });
    elements.cropY?.addEventListener('input', e => { cropRect.y = parseInt(e.target.value); drawImage(); });
    elements.cropWidth?.addEventListener('input', e => { cropRect.width = parseInt(e.target.value); drawImage(); });
    elements.cropHeight?.addEventListener('input', e => { cropRect.height = parseInt(e.target.value); drawImage(); });
    elements.brightness?.addEventListener('input', e => { brightnessValue = parseInt(e.target.value); drawImage(); });
    elements.contrast?.addEventListener('input', e => { contrastValue = parseInt(e.target.value); drawImage(); });
    elements.backgroundColor?.addEventListener('change', e => { bgColor = e.target.value; drawImage(); });

    // Apply Edit
    elements.editApplyBtn?.addEventListener('click', () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cropRect.width;
        tempCanvas.height = cropRect.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            tempCtx.fillStyle = bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor;
            tempCtx.fillRect(0, 0, cropRect.width, cropRect.height);
            tempCtx.filter = `brightness(${100 + brightnessValue}%) contrast(${100 + contrastValue}%)`;
            tempCtx.drawImage(image, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, cropRect.width, cropRect.height);
            editedImage = tempCanvas.toDataURL('image/jpeg');
            elements.previewImage.src = editedImage;
            callRasaAPI("show_review");
            elements.editModal.style.display = 'none';
        }
    });

    elements.editCancelBtn?.addEventListener('click', () => elements.editModal.style.display = 'none');

    // Image Modal
    elements.imageReviewModal?.addEventListener('click', e => {
        if (e.target === elements.imageReviewModal || e.target === elements.deleteImageBtn) {
            elements.imageReviewModal.style.display = 'none';
        }
    });

    elements.deleteImageBtn?.addEventListener('click', () => {
        clearPreview();
        elements.imageReviewModal.style.display = 'none';
    });

    // Genres Modal
    elements.moreOptionsBtn?.addEventListener('click', openGenresModal);
    elements.closeGenresModal?.addEventListener('click', closeGenresModal);

    // Welcome Buttons (Updated selector for application side)
    document.querySelectorAll('.left-column .welcome-buttons button[data-genre]').forEach(button => {
        button.classList.add('ripple-btn');
        button.addEventListener('click', () => {
            const genreName = button.getAttribute('data-genre');
            const genre = genres.find(g => g.name === genreName);
            if (genre?.message) {
                displayMessage(sanitizeMessage(genre.message), 'user');
                saveChatHistory(genre.message, 'user');
                callRasaAPI(genre.message);
                hideWelcomeMessage();
            } else {
                showErrorMessage('এই সেবা উপলব্ধ নয়।');
            }
        });
    });
});
