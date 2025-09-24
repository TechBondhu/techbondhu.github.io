/**

Combined chat functionality for handling Firebase, chat history, and UI interactions.
Merged from script.js and chatHistory.js, with duplicates removed and code optimized.
Updated to handle two separate chat boxes: left (আবেদন) and right (প্রশ্ন জিজ্ঞাসা).
Messages are isolated: left messages only in left, right in right.
Welcome message hides after first message in each chat.
Right chat displays messages in a clean, beautiful way under "প্রশ্ন জিজ্ঞাসা".
Each chat has its own chatId and history.
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
let leftChatId = localStorage.getItem('leftChatId') || null;
let rightChatId = localStorage.getItem('rightChatId') || null;
let currentUserUid = null;
let selectedFile = null;
let editedImage = null;
// DOM Elements
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
messagesDiv: document.getElementById('messages'), // Left chat messages
messagesRight: document.getElementById('messages-right'), // Right chat messages
welcomeMessage: document.getElementById('welcomeMessage'), // Assuming left welcome
welcomeMessageRight: document.getElementById('welcomeMessage-right'), // Add this if needed in HTML, or handle dynamically
userInput: document.getElementById('userInput'), // Left input
userInputRight: document.getElementById('userInput-right'), // Right input
sendBtn: document.getElementById('sendBtn'), // Left send
sendBtnRight: document.getElementById('sendBtn-right'), // Right send
uploadBtn: document.getElementById('uploadBtn'),
uploadBtnRight: document.getElementById('uploadBtn-right'),
fileInput: document.getElementById('fileInput'),
fileInputRight: document.getElementById('fileInput-right'),
previewContainer: document.getElementById('previewContainer'),
previewContainerRight: document.getElementById('previewContainer-right'),
previewImage: document.getElementById('previewImage'),
previewImageRight: document.getElementById('previewImage-right'),
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
moreOptionsBtn: document.getElementById('moreOptionsBtn'),
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
// Genres Data (Restored)
const genres = [
{ name: 'এনআইডি আবেদন', icon: 'fas fa-id-card', message: 'আমার জন্য একটি এনআইডি তৈরি করতে চাই' },
{ name: 'পাসপোর্ট আবেদন', icon: 'fas fa-passport', message: 'আমি পাসপোর্ট আবেদন করতে চাই' },
{ name: 'কোম্পানি রেজিস্ট্রেশন', icon: 'fas fa-building', message: 'আমি কোম্পানি রেজিস্ট্রেশন করতে চাই' },
];
// Auth State Listener
function initializeApp() {
auth.onAuthStateChanged(user => {
if (user) {
currentUserUid = user.uid;
if (elements.messagesDiv && elements.historyList && elements.messagesRight) {
loadChatHistory(); // Loads combined history, but messages loaded per chatId
if (leftChatId) loadChatMessages(leftChatId, 'left');
else startNewChat('left');
if (rightChatId) loadChatMessages(rightChatId, 'right');
else startNewChat('right');
} else {
showErrorMessage('DOM elements not found. Please check your HTML.', 'left');
}
} else {
currentUserUid = null;
window.location.href = 'login.html';
}
});
}
// Utility Functions
function sanitizeMessage(message) {
const div = document.createElement('div');
div.textContent = message;
return div.innerHTML;
}
function displayMessage(message, sender, side) {
const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
if (!messagesContainer) {
console.error(${side} messages container not found);
return;
}
const messageDiv = document.createElement('div');
messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message', 'slide-in');
if (typeof message === 'string' && (message.startsWith('http') || message.startsWith('data:image'))) {
const img = document.createElement('img');
img.src = message;
img.classList.add('chat-image');
img.alt = 'Uploaded Image';
img.addEventListener('click', () => openImageModal(message));
messageDiv.appendChild(img);
} else {
messageDiv.innerHTML = sanitizeMessage(message);
}
// For right side, add extra styling for beautiful display under "প্রশ্ন জিজ্ঞাসা"
if (side === 'right') {
messageDiv.style.margin = '10px 0';
messageDiv.style.padding = '10px';
messageDiv.style.borderRadius = '8px';
messageDiv.style.backgroundColor = sender === 'user' ? '#e0f7fa' : '#f1f8e9';
}
messagesContainer.appendChild(messageDiv);
messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
function showErrorMessage(message, side) {
console.error(message);
displayMessage(sanitizeMessage(message), 'bot', side);
}
function hideWelcomeMessage(side) {
const welcome = side === 'left' ? elements.welcomeMessage : elements.welcomeMessageRight;
if (welcome && welcome.style.display !== 'none') {
welcome.classList.add('fade-out');
setTimeout(() => {
welcome.style.display = 'none';
welcome.classList.remove('fade-out');
}, 300);
}
}
function showTypingIndicator(side) {
const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
if (!messagesContainer) {
console.error(${side} messages container not found);
return null;
}
const typingDiv = document.createElement('div');
typingDiv.classList.add('typing-indicator');
typingDiv.innerHTML = '';
messagesContainer.appendChild(typingDiv);
messagesContainer.scrollTop = messagesContainer.scrollHeight;
return typingDiv;
}
// Chat History Functions
async function startNewChat(side) {
if (!currentUserUid) return showErrorMessage('ইউজার লগইন করেননি।', side);
const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
if (!messagesContainer) return showErrorMessage('Messages container not found', side);
try {
const chatRef = await db.collection('chats').add({
uid: currentUserUid,
name: ${side === 'left' ? 'নতুন আবেদন চ্যাট' : 'নতুন প্রশ্ন চ্যাট'},
last_message: 'চ্যাট শুরু হয়েছে',
created_at: firebase.firestore.FieldValue.serverTimestamp(),
updated_at: firebase.firestore.FieldValue.serverTimestamp(),
side: side // Add side to distinguish in DB
});
const chatId = chatRef.id;
if (side === 'left') {
leftChatId = chatId;
localStorage.setItem('leftChatId', leftChatId);
} else {
rightChatId = chatId;
localStorage.setItem('rightChatId', rightChatId);
}
await db.collection('chats').doc(chatId).collection('messages').add({
message: 'Chat session started',
sender: 'system',
timestamp: firebase.firestore.FieldValue.serverTimestamp(),
uid: currentUserUid
});
messagesContainer.innerHTML = '';
const welcome = side === 'left' ? elements.welcomeMessage : elements.welcomeMessageRight;
if (welcome) welcome.style.display = 'block';
await loadChatHistory();
} catch (error) {
showErrorMessage('নতুন চ্যাট শুরু করতে সমস্যা: ' + error.message, side);
}
}
async function saveChatHistory(message, sender, side) {
if (!currentUserUid) return showErrorMessage('ইউজার লগইন করেননি।', side);
if (!message || typeof message !== 'string') return showErrorMessage('অবৈধ মেসেজ।', side);
const chatId = side === 'left' ? leftChatId : rightChatId;
if (!chatId) await startNewChat(side);
if (!chatId) return showErrorMessage('চ্যাট তৈরি ব্যর্থ।', side);
try {
const chatDoc = await db.collection('chats').doc(chatId).get();
if (!chatDoc.exists) return showErrorMessage('চ্যাট ডকুমেন্ট পাওয়া যায়নি।', side);
await db.collection('chats').doc(chatId).collection('messages').add({
message: message,
sender: sender,
timestamp: firebase.firestore.FieldValue.serverTimestamp(),
uid: currentUserUid
});
await db.collection('chats').doc(chatId).update({
last_message: message,
updated_at: firebase.firestore.FieldValue.serverTimestamp()
});
} catch (error) {
showErrorMessage('চ্যাট হিস্টোরি সংরক্ষণে সমস্যা: ' + error.message, side);
}
}
async function loadChatHistory(searchTerm = '') {
if (!currentUserUid) return;
try {
let query = db.collection('chats').where('uid', '==', currentUserUid).orderBy('updated_at', 'desc');
const snapshot = await query.get();
elements.historyList.innerHTML = '';
snapshot.forEach(doc => {
const data = doc.data();
const name = data.name || 'নতুন চ্যাট';
if (searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase())) return;
const item = document.createElement('div');
item.className = 'history-item';
item.innerHTML = `
                
                    ${sanitizeMessage(name)}
                    ${data.updated_at ? new Date(data.updated_at.toDate()).toLocaleString() : ''}
                
                
                    
                    
                
            `;
            item.addEventListener('click', e => {
                if (e.target.classList.contains('rename-chat') || e.target.classList.contains('delete-chat')) return;
                const side = data.side || 'left';
                if (side === 'left') leftChatId = doc.id;
                else rightChatId = doc.id;
                localStorage.setItem(`${side}ChatId`, doc.id);
                loadChatMessages(doc.id, side);
            });
            item.querySelector('.rename-chat').addEventListener('click', () => {
                currentChatId = doc.id;
                elements.renameModal.style.display = 'block';
                elements.renameInput.value = name;
            });
            item.querySelector('.delete-chat').addEventListener('click', () => {
                currentChatId = doc.id;
                elements.deleteModal.style.display = 'block';
            });
            elements.historyList.appendChild(item);
        });
    } catch (error) {
        console.error('চ্যাট হিস্টোরি লোডে সমস্যা: ' + error.message);
    }
}
async function loadChatMessages(chatId, side) {
const messagesContainer = side === 'left' ? elements.messagesDiv : elements.messagesRight;
if (!messagesContainer) return console.error(${side} messages container not found);
try {
const snapshot = await db.collection('chats').doc(chatId).collection('messages').orderBy('timestamp').get();
messagesContainer.innerHTML = '';
let hasMessage = false;
snapshot.forEach(doc => {
const data = doc.data();
displayMessage(data.message, data.sender, side);
hasMessage = true;
});
if (hasMessage) hideWelcomeMessage(side);
} catch (error) {
showErrorMessage('চ্যাট মেসেজ লোডে সমস্যা: ' + error.message, side);
}
}
function toggleSidebar() {
elements.sidebar.classList.toggle('open');
document.querySelector('.chat-container').classList.toggle('sidebar-open');
}
function closeSidebarHandler() {
elements.sidebar.classList.remove('open');
document.querySelector('.chat-container').classList.remove('sidebar-open');
}
function deleteChat() {
if (currentChatId) {
db.collection('chats').doc(currentChatId).delete().then(() => {
elements.deleteModal.style.display = 'none';
startNewChat('left');
startNewChat('right');
loadChatHistory();
}).catch(error => console.error('চ্যাট মুছতে সমস্যা: ' + error.message));
}
}
function renameChat() {
const newName = elements.renameInput.value.trim();
if (newName && currentChatId) {
db.collection('chats').doc(currentChatId).update({
name: newName
}).then(() => {
elements.renameModal.style.display = 'none';
loadChatHistory();
}).catch(error => console.error('চ্যাট নাম পরিবর্তনে সমস্যা: ' + error.message));
}
}
// Image Handling Functions
function clearPreview(side) {
selectedFile = null;
editedImage = null;
const previewImage = side === 'left' ? elements.previewImage : elements.previewImageRight;
const previewContainer = side === 'left' ? elements.previewContainer : elements.previewContainerRight;
if (previewImage) previewImage.src = '';
if (previewContainer) previewContainer.style.display = 'none';
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
ctx.filter = brightness(${100 + brightnessValue}%) contrast(${100 + contrastValue}%);
ctx.drawImage(image, 0, 0);
ctx.strokeStyle = 'red';
ctx.lineWidth = 2;
ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
ctx.filter = 'none';
}
// Genres Modal Functions (unchanged, but send to left chat by default)
function renderGenres() {
if (!elements.genresList) return;
elements.genresList.innerHTML = '';
genres.forEach(genre => {
const item = document.createElement('div');
item.className = 'genre-item ripple-btn';
item.innerHTML = <i class="${genre.icon}"></i><span>${sanitizeMessage(genre.name)}</span>;
item.addEventListener('click', () => {
elements.genresModal?.classList.add('slide-out');
setTimeout(() => {
elements.genresModal.style.display = 'none';
elements.genresModal.classList.remove('slide-out');
}, 300);
if (genre.message) {
displayMessage(sanitizeMessage(genre.message), 'user', 'left'); // Default to left
saveChatHistory(sanitizeMessage(genre.message), 'user', 'left');
callRasaAPI(genre.message, {}, 'left');
hideWelcomeMessage('left');
} else {
showErrorMessage('এই সেবা উপলব্ধ নয়।', 'left');
}
});
elements.genresList.appendChild(item);
});
}
function openGenresModal() {
renderGenres();
if (elements.genresModal) {
elements.genresModal.classList.add('slide-in');
elements.genresModal.style.display = 'block';
setTimeout(() => elements.genresModal.classList.remove('slide-in'), 300);
}
}
function closeGenresModal() {
if (elements.genresModal) {
elements.genresModal.classList.add('slide-out');
setTimeout(() => {
elements.genresModal.style.display = 'none';
elements.genresModal.classList.remove('slide-out');
}, 300);
}
}
// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
if (!elements.messagesDiv || !elements.historyList || !elements.messagesRight) {
console.error('Critical DOM elements not found. Please check your HTML.');
return;
}
initializeApp();
// Chat History Handlers
elements.historyIcon?.addEventListener('click', toggleSidebar);
elements.closeSidebar?.addEventListener('click', closeSidebarHandler);
elements.newChatIcon?.addEventListener('click', () => {
startNewChat('left'); // Or prompt for side, but default to left
startNewChat('right');
});
elements.searchInput?.addEventListener('input', () => loadChatHistory(elements.searchInput.value.trim()));
elements.cancelDelete?.addEventListener('click', () => elements.deleteModal.style.display = 'none');
elements.confirmDelete?.addEventListener('click', deleteChat);
elements.cancelRename?.addEventListener('click', () => elements.renameModal.style.display = 'none');
elements.saveRename?.addEventListener('click', renameChat);
// Message Sending for left
elements.sendBtn?.addEventListener('click', () => sendMessage('left'));
elements.userInput?.addEventListener('keypress', e => {
if (e.key === 'Enter' && !e.repeat) sendMessage('left');
});
// Message Sending for right
elements.sendBtnRight?.addEventListener('click', () => sendMessage('right'));
elements.userInputRight?.addEventListener('keypress', e => {
if (e.key === 'Enter' && !e.repeat) sendMessage('right');
});
// Image Upload for left
elements.uploadBtn?.addEventListener('click', () => elements.fileInput?.click());
elements.fileInput?.addEventListener('change', () => {
const file = elements.fileInput.files[0];
if (file) {
selectedFile = file;
const reader = new FileReader();
reader.onload = e => {
if (elements.previewImage) elements.previewImage.src = e.target.result;
if (elements.previewContainer) elements.previewContainer.style.display = 'block';
};
reader.onerror = () => showErrorMessage('ইমেজ লোডে সমস্যা।', 'left');
reader.readAsDataURL(file);
}
elements.fileInput.value = '';
});
// Image Upload for right
elements.uploadBtnRight?.addEventListener('click', () => elements.fileInputRight?.click());
elements.fileInputRight?.addEventListener('change', () => {
const file = elements.fileInputRight.files[0];
if (file) {
selectedFile = file;
const reader = new FileReader();
reader.onload = e => {
if (elements.previewImageRight) elements.previewImageRight.src = e.target.result;
if (elements.previewContainerRight) elements.previewContainerRight.style.display = 'block';
};
reader.onerror = () => showErrorMessage('ইমেজ লোডে সমস্যা।', 'right');
reader.readAsDataURL(file);
}
elements.fileInputRight.value = '';
});
// Image Review for left
elements.previewImage?.addEventListener('click', () => {
if (elements.reviewImage) elements.reviewImage.src = elements.previewImage.src;
if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'block';
});
// Image Review for right
elements.previewImageRight?.addEventListener('click', () => {
if (elements.reviewImage) elements.reviewImage.src = elements.previewImageRight.src;
if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'block';
});
// Image Editing for left
elements.previewImage?.addEventListener('dblclick', () => {
if (elements.previewImage) {
image.src = elements.previewImage.src || '';
image.onload = () => {
if (elements.editCanvas) {
elements.editCanvas.width = image.width;
elements.editCanvas.height = image.height;
cropRect.width = Math.min(200, image.width);
cropRect.height = Math.min(200, image.height);
drawImage();
if (elements.editModal) elements.editModal.style.display = 'block';
}
};
}
});
// Image Editing for right
elements.previewImageRight?.addEventListener('dblclick', () => {
if (elements.previewImageRight) {
image.src = elements.previewImageRight.src || '';
image.onload = () => {
if (elements.editCanvas) {
elements.editCanvas.width = image.width;
elements.editCanvas.height = image.height;
cropRect.width = Math.min(200, image.width);
cropRect.height = Math.min(200, image.height);
drawImage();
if (elements.editModal) elements.editModal.style.display = 'block';
}
};
}
});
// Canvas Controls (shared)
elements.cropX?.addEventListener('input', e => { cropRect.x = parseInt(e.target.value); drawImage(); });
elements.cropY?.addEventListener('input', e => { cropRect.y = parseInt(e.target.value); drawImage(); });
elements.cropWidth?.addEventListener('input', e => { cropRect.width = parseInt(e.target.value); drawImage(); });
elements.cropHeight?.addEventListener('input', e => { cropRect.height = parseInt(e.target.value); drawImage(); });
elements.brightness?.addEventListener('input', e => { brightnessValue = parseInt(e.target.value); drawImage(); });
elements.contrast?.addEventListener('input', e => { contrastValue = parseInt(e.target.value); drawImage(); });
elements.backgroundColor?.addEventListener('change', e => { bgColor = e.target.value; drawImage(); });
// Apply Edit (updates the current previewImage based on which was dblclicked)
elements.editApplyBtn?.addEventListener('click', () => {
const tempCanvas = document.createElement('canvas');
tempCanvas.width = cropRect.width;
tempCanvas.height = cropRect.height;
const tempCtx = tempCanvas.getContext('2d');
if (tempCtx && editedImage) {
tempCtx.fillStyle = bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor;
tempCtx.fillRect(0, 0, cropRect.width, cropRect.height);
tempCtx.filter = brightness(${100 + brightnessValue}%) contrast(${100 + contrastValue}%);
tempCtx.drawImage(image, cropRect.x, cropRect.y, cropRect.width, cropRect.height, 0, 0, cropRect.width, cropRect.height);
editedImage = tempCanvas.toDataURL('image/jpeg');
// Update the correct preview based on which side was editing (assume last preview used, or add side param if needed)
if (elements.previewImage.src) elements.previewImage.src = editedImage;
if (elements.previewImageRight.src) elements.previewImageRight.src = editedImage;
callRasaAPI("show_review"); // Assuming this is global, adjust if needed
if (elements.editModal) elements.editModal.style.display = 'none';
}
});
elements.editCancelBtn?.addEventListener('click', () => {
if (elements.editModal) elements.editModal.style.display = 'none';
});
// Image Modal
elements.imageReviewModal?.addEventListener('click', e => {
if (e.target === elements.imageReviewModal || e.target === elements.deleteImageBtn) {
if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'none';
}
});
elements.deleteImageBtn?.addEventListener('click', () => {
clearPreview('left'); // Or handle side
clearPreview('right');
if (elements.imageReviewModal) elements.imageReviewModal.style.display = 'none';
});
// Genres Modal
elements.moreOptionsBtn?.addEventListener('click', openGenresModal);
elements.closeGenresModal?.addEventListener('click', closeGenresModal);
// Welcome Buttons (assume for left, add for right if needed)
document.querySelectorAll('.welcome-buttons button[data-genre]').forEach(button => {
button.classList.add('ripple-btn');
button.addEventListener('click', () => {
const genreName = button.getAttribute('data-genre');
const genre = genres.find(g => g.name === genreName);
if (genre?.message) {
displayMessage(sanitizeMessage(genre.message), 'user', 'left');
saveChatHistory(genre.message, 'user', 'left');
callRasaAPI(genre.message, {}, 'left');
hideWelcomeMessage('left');
} else {
showErrorMessage('এই সেবা উপলব্ধ নয়।', 'left');
}
});
});
});
