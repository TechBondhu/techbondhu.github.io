/**
 * Combined chat functionality for handling Firebase, chat history, and UI interactions.
 * Merged from script.js and chatHistory.js, with duplicates removed and code optimized.
 * Updated to include new genres and improved chat history management.
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
    messagesDiv: document.getElementById('messages'),
    welcomeMessage: document.getElementById('welcomeMessage'),
    userInput: document.getElementById('userInput'),
    sendBtn: document.getElementById('sendBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    fileInput: document.getElementById('fileInput'),
    previewContainer: document.getElementById('previewContainer'),
    previewImage: document.getElementById('previewImage'),
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

// Genres Data (Updated with new entries)
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
    { name: 'পুলিশ চাকরি', icon: 'fas fa-user-shield', message: 'আমি পুলিশ চাকরির জন্য আবেদন করতে চাই' },
    { name: 'আনসার-ভিডিপি চাকরি', icon: 'fas fa-users-cog', message: 'আমি আনসার-ভিডিপি চাকরির জন্য আবেদন করতে চাই' },
    { name: 'রেলওয়ে চাকরি', icon: 'fas fa-train', message: 'আমি রেলওয়ে চাকরির জন্য আবেদন করতে চাই' },
    { name: 'পোস্ট অফিস চাকরি', icon: 'fas fa-envelope', message: 'আমি পোস্ট অফিস চাকরির জন্য আবেদন করতে চাই' },
    { name: 'শিক্ষক নিয়োগ (সরকারি)', icon: 'fas fa-chalkboard-teacher', message: 'আমি শিক্ষক নিয়োগ (সরকারি) চাকরির জন্য আবেদন করতে চাই' },
    { name: 'স্বাস্থ্যকর্মী চাকরি', icon: 'fas fa-user-md', message: 'আমি স্বাস্থ্যকর্মী চাকরির জন্য আবেদন করতে চাই' },
    { name: 'বাংলা একাডেমি চাকরি', icon: 'fas fa-book', message: 'আমি বাংলা একাডেমি চাকরির জন্য আবেদন করতে চাই' },
    { name: 'বিআরটিসি চাকরি', icon: 'fas fa-bus', message: 'আমি বিআরটিসি চাকরির জন্য আবেদন করতে চাই' },
    { name: 'কাস্টমস চাকরি', icon: 'fas fa-boxes', message: 'আমি কাস্টমস চাকরির জন্য আবেদন করতে চাই' },
    { name: 'ট্যাক্স চাকরি', icon: 'fas fa-file-invoice-dollar', message: 'আমি ট্যাক্স চাকরির জন্য আবেদন করতে চাই' },
    { name: 'ফায়ার সার্ভিস চাকরি', icon: 'fas fa-fire', message: 'আমি ফায়ার সার্ভিস চাকরির জন্য আবেদন করতে চাই' },
    { name: 'জেলা প্রশাসন চাকরি', icon: 'fas fa-landmark', message: 'আমি জেলা প্রশাসন চাকরির জন্য আবেদন করতে চাই' },
    { name: 'বিমান বন্দর চাকরি', icon: 'fas fa-plane', message: 'আমি বিমান বন্দর চাকরির জন্য আবেদন করতে চাই' },
    { name: 'বিসিসি (BCS) চাকরি', icon: 'fas fa-graduation-cap', message: 'আমি বিসিসি চাকরির জন্য আবেদন করতে চাই' },
    { name: 'ব্যাংক চাকরি (বেসরকারি)', icon: 'fas fa-university', message: 'আমি ব্যাংক চাকরি (বেসরকারি) আবেদন করতে চাই' },
    { name: 'এনজিও চাকরি', icon: 'fas fa-hands-helping', message: 'আমি এনজিও চাকরির জন্য আবেদন করতে চাই' },
    { name: 'আইটি চাকরি (সফটওয়্যার)', icon: 'fas fa-laptop-code', message: 'আমি আইটি চাকরি (সফটওয়্যার) আবেদন করতে চাই' },
    { name: 'টেলিকম চাকরি', icon: 'fas fa-phone', message: 'আমি টেলিকম চাকরির জন্য আবেদন করতে চাই' },
    { name: 'গ্যার্মেন্ট চাকরি', icon: 'fas fa-tshirt', message: 'আমি গ্যার্মেন্ট চাকরির জন্য আবেদন করতে চাই' },
    { name: 'ফার্মাসি চাকরি', icon: 'fas fa-prescription-bottle', message: 'আমি ফার্মাসি চাকরির জন্য আবেদন করতে চাই' },
    { name: 'হোটেল চাকরি', icon: 'fas fa-hotel', message: 'আমি হোটেল চাকরির জন্য আবেদন করতে চাই' },
    { name: 'রেস্টুরেন্ট চাকরি', icon: 'fas fa-utensils', message: 'আমি রেস্টুরেন্ট চাকরির জন্য আবেদন করতে চাই' },
    { name: 'কনস্ট্রাকশন চাকরি', icon: 'fas fa-tools', message: 'আমি কনস্ট্রাকশন চাকরির জন্য আবেদন করতে চাই' },
    { name: 'অটোমোবাইল চাকরি', icon: 'fas fa-car-side', message: 'আমি অটোমোবাইল চাকরির জন্য আবেদন করতে চাই' },
    { name: 'মার্কেটিং চাকরি', icon: 'fas fa-bullhorn', message: 'আমি মার্কেটিং চাকরির জন্য আবেদন করতে চাই' },
    { name: 'একাউন্টস চাকরি', icon: 'fas fa-calculator', message: 'আমি একাউন্টস চাকরির জন্য আবেদন করতে চাই' },
    { name: 'এইচআর চাকরি', icon: 'fas fa-users', message: 'আমি এইচআর চাকরির জন্য আবেদন করতে চাই' },
    { name: 'গ্রাফিক ডিজাইন চাকরি', icon: 'fas fa-paint-brush', message: 'আমি গ্রাফিক ডিজাইন চাকরির জন্য আবেদন করতে চাই' },
    { name: 'ফটোগ্রাফি চাকরি', icon: 'fas fa-camera', message: 'আমি ফটোগ্রাফি চাকরির জন্য আবেদন করতে চাই' },
    { name: 'জার্নালিজম চাকরি', icon: 'fas fa-newspaper', message: 'আমি জার্নালিজম চাকরির জন্য আবেদন করতে চাই' },
    { name: 'রিয়েল এস্টেট চাকরি', icon: 'fas fa-home', message: 'আমি রিয়েল এস্টেট চাকরির জন্য আবেদন করতে চাই' },
    { name: 'লজিস্টিক্স চাকরি', icon: 'fas fa-truck', message: 'আমি লজিস্টিক্স চাকরির জন্য আবেদন করতে চাই' },
    { name: 'রিটেইল চাকরি', icon: 'fas fa-shopping-cart', message: 'আমি রিটেইল চাকরির জন্য আবেদন করতে চাই' },
    { name: 'ইন্টারনেট মার্কেটিং চাকরি', icon: 'fas fa-globe', message: 'আমি ইন্টারনেট মার্কেটিং চাকরির জন্য আবেদন করতে চাই' },
    { name: 'কনটেন্ট রাইটিং চাকরি', icon: 'fas fa-pen', message: 'আমি কনটেন্ট রাইটিং চাকরির জন্য আবেদন করতে চাই' },
    { name: 'ডিজিটাল মার্কেটিং চাকরি', icon: 'fas fa-chart-line', message: 'আমি ডিজিটাল মার্কেটিং চাকরির জন্য আবেদন করতে চাই' },
    { name: 'সেলস চাকরি', icon: 'fas fa-hand-holding-usd', message: 'আমি সেলস চাকরির জন্য আবেদন করতে চাই' },
    { name: 'কাস্টমার সার্ভিস চাকরি', icon: 'fas fa-headset', message: 'আমি কাস্টমার সার্ভিস চাকরির জন্য আবেদন করতে চাই' },
    { name: 'প্রোডাকশন চাকরি', icon: 'fas fa-industry', message: 'আমি প্রোডাকশন চাকরির জন্য আবেদন করতে চাই' },
    { name: 'এডভোকেসি চাকরি', icon: 'fas fa-balance-scale', message: 'আমি এডভোকেসি চাকরির জন্য আবেদন করতে চাই' },
    { name: 'এডুকেশনাল কনসালটেন্ট চাকরি', icon: 'fas fa-chalkboard', message: 'আমি এডুকেশনাল কনসালটেন্ট চাকরির জন্য আবেদন করতে চাই' },
    { name: 'ট্রেনিং চাকরি', icon: 'fas fa-user-graduate', message: 'আমি ট্রেনিং চাকরির জন্য আবেদন করতে চাই' },
    { name: 'রিসার্চ চাকরি', icon: 'fas fa-flask', message: 'আমি রিসার্চ চাকরির জন্য আবেদন করতে চাই' },
    { name: 'ফ্রিল্যান্স চাকরি', icon: 'fas fa-user-tie', message: 'আমি ফ্রিল্যান্স চাকরির জন্য আবেদন করতে চাই' },
    { name: 'ইনশিওরেন্স চাকরি', icon: 'fas fa-shield-alt', message: 'আমি ইনশিওরেন্স চাকরির জন্য আবেদন করতে চাই' },
    { name: 'এভিয়েশন চাকরি', icon: 'fas fa-plane-departure', message: 'আমি এভিয়েশন চাকরির জন্য আবেদন করতে চাই' },
    { name: 'এন্টারটেইনমেন্ট চাকরি', icon: 'fas fa-film', message: 'আমি এন্টারটেইনমেন্ট চাকরির জন্য আবেদন করতে চাই' },
    { name: 'অর্গানিক ফার্মিং চাকরি', icon: 'fas fa-leaf', message: 'আমি অর্গানিক ফার্মিং চাকরির জন্য আবেদন করতে চাই' }
];

// Auth State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserUid = user.uid;
        loadChatHistory();
        if (currentChatId) loadChatMessages(currentChatId);
        else startNewChat();
    } else {
        auth.signInAnonymously().catch(error => showErrorMessage('Authentication error: ' + error.message));
    }
});

// Utility Functions
function sanitizeMessage(message) {
    const div = document.createElement('div');
    div.textContent = message;
    return div.innerHTML;
}

function displayMessage(message, sender) {
    if (!elements.messagesDiv) return;
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
    elements.messagesDiv.appendChild(messageDiv);
    elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
}

function showErrorMessage(message) {
    displayMessage(sanitizeMessage(message), 'bot');
    saveChatHistory(sanitizeMessage(message), 'bot');
}

function hideWelcomeMessage() {
    if (elements.welcomeMessage && elements.welcomeMessage.style.display !== 'none') {
        elements.welcomeMessage.classList.add('fade-out');
        setTimeout(() => {
            elements.welcomeMessage.style.display = 'none';
            elements.welcomeMessage.classList.remove('fade-out');
        }, 300);
    }
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    elements.messagesDiv?.appendChild(typingDiv);
    elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
    return typingDiv;
}

// Chat History Functions
async function startNewChat() {
    if (!currentUserUid) return showErrorMessage('ইউজার লগইন করেননি।');
    try {
        const chatRef = await db.collection('users').doc(currentUserUid).collection('chats').add({
            title: 'নতুন চ্যাট',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        currentChatId = chatRef.id;
        localStorage.setItem('currentChatId', currentChatId);
        elements.messagesDiv.innerHTML = '';
        elements.welcomeMessage.style.display = 'block';
        await loadChatHistory();
    } catch (error) {
        showErrorMessage('নতুন চ্যাট শুরু করতে সমস্যা: ' + error.message);
    }
}

async function saveChatHistory(message, sender) {
    if (!currentUserUid || !currentChatId) return showErrorMessage('ইউজার বা চ্যাট আইডি পাওয়া যায়নি।');
    try {
        await db.collection('users').doc(currentUserUid).collection('chats').doc(currentChatId).collection('messages').add({
            message: sanitizeMessage(message),
            sender,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        showErrorMessage('মেসেজ সেভ করতে সমস্যা: ' + error.message);
    }
}

async function loadChatHistory(searchQuery = '') {
    if (!currentUserUid || !elements.historyList) return showErrorMessage('ইউজার লগইন করেননি।');
    elements.historyList.innerHTML = '<div class="loading">লোড হচ্ছে...</div>';
    try {
        let query = db.collection('users').doc(currentUserUid).collection('chats').orderBy('timestamp', 'desc');
        if (searchQuery) {
            query = query.where('title', '>=', searchQuery).where('title', '<=', searchQuery + '\uf8ff');
        }
        const snapshot = await query.get();
        elements.historyList.innerHTML = '';
        if (snapshot.empty) {
            elements.historyList.innerHTML = '<div>কোনো চ্যাট হিস্ট্রি নেই।</div>';
            return;
        }
        snapshot.forEach(doc => {
            const chat = doc.data();
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.setAttribute('data-chat-id', doc.id);
            historyItem.innerHTML = `
                <div class="history-content">
                    <span class="history-title">${sanitizeMessage(chat.title || 'নতুন চ্যাট')}</span>
                    <span class="history-preview">${sanitizeMessage(chat.last_message || 'কোনো মেসেজ নেই')}</span>
                </div>
                <div class="history-actions">
                    <i class="fas fa-edit rename-chat" title="নাম পরিবর্তন"></i>
                    <i class="fas fa-trash delete-chat" title="মুছুন"></i>
                </div>
            `;
            historyItem.addEventListener('click', async e => {
                if (e.target.classList.contains('rename-chat') || e.target.classList.contains('delete-chat')) return;
                currentChatId = doc.id;
                localStorage.setItem('currentChatId', currentChatId);
                await loadChatMessages(currentChatId);
                elements.sidebar?.classList.remove('open');
            });
            historyItem.querySelector('.rename-chat')?.addEventListener('click', () => {
                elements.renameModal?.setAttribute('data-chat-id', doc.id);
                elements.renameInput.value = chat.title || 'নতুন চ্যাট';
                elements.renameModal.style.display = 'block';
            });
            historyItem.querySelector('.delete-chat')?.addEventListener('click', () => {
                elements.deleteModal?.setAttribute('data-chat-id', doc.id);
                elements.deleteModal.style.display = 'block';
            });
            elements.historyList.appendChild(historyItem);
        });
    } catch (error) {
        showErrorMessage('চ্যাট হিস্ট্রি লোড করতে সমস্যা: ' + error.message);
    }
}

async function loadChatMessages(chatId) {
    if (!chatId || !elements.messagesDiv) return showErrorMessage('চ্যাট আইডি বা মেসেজ এলাকা পাওয়া যায়নি।');
    elements.messagesDiv.innerHTML = '';
    elements.welcomeMessage.style.display = 'none';
    try {
        const snapshot = await db.collection('users').doc(currentUserUid).collection('chats').doc(chatId).collection('messages').orderBy('timestamp', 'asc').get();
        snapshot.forEach(doc => {
            const msg = doc.data();
            if (msg.sender === 'user' || msg.sender === 'bot') displayMessage(sanitizeMessage(msg.message), msg.sender);
        });
        const submissions = await db.collection('submissions').where('chat_id', '==', chatId).get();
        submissions.forEach(doc => {
            const sub = doc.data();
            if (sub.review_data) displayReview(sub.review_data);
        });
        elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
    } catch (error) {
        showErrorMessage('মেসেজ লোড করতে সমস্যা: ' + error.message);
    }
}

async function deleteChat() {
    const chatId = elements.deleteModal?.getAttribute('data-chat-id');
    if (!chatId) return showErrorMessage('চ্যাট আইডি পাওয়া যায়নি।');
    try {
        await db.collection('users').doc(currentUserUid).collection('chats').doc(chatId).delete();
        const messagesSnapshot = await db.collection('users').doc(currentUserUid).collection('chats').doc(chatId).collection('messages').get();
        if (!messagesSnapshot.empty) {
            const batch = db.batch();
            messagesSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
        elements.deleteModal.style.display = 'none';
        if (chatId === currentChatId) {
            currentChatId = null;
            localStorage.removeItem('currentChatId');
            elements.messagesDiv.innerHTML = '';
            elements.welcomeMessage.style.display = 'block';
            await startNewChat();
        }
        await loadChatHistory();
    } catch (error) {
        showErrorMessage('চ্যাট ডিলিট করতে সমস্যা: ' + error.message);
    }
}

async function renameChat() {
    const chatId = elements.renameModal?.getAttribute('data-chat-id');
    const newName = elements.renameInput?.value.trim();
    if (!chatId || !newName) return showErrorMessage('চ্যাট আইডি বা নাম অবৈধ।');
    try {
        await db.collection('users').doc(currentUserUid).collection('chats').doc(chatId).update({
            title: newName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        elements.renameModal.style.display = 'none';
        await loadChatHistory();
    } catch (error) {
        showErrorMessage('নাম পরিবর্তন করতে সমস্যা: ' + error.message);
    }
}

// UI Interaction Functions
function toggleSidebar() {
    if (elements.sidebar) {
        elements.sidebar.classList.toggle('open');
        if (elements.sidebar.classList.contains('open')) loadChatHistory();
    }
}

function closeSidebarHandler() {
    elements.sidebar?.classList.remove('open');
}

function sendMessage() {
    const message = elements.userInput?.value.trim();
    if (!message && !selectedFile) return;
    if (!currentChatId) startNewChat();
    if (message) {
        displayMessage(message, 'user');
        saveChatHistory(message, 'user');
        callRasaAPI(message);
        elements.userInput.value = '';
    }
    if (selectedFile) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('user-message', 'slide-in');
        const img = document.createElement('img');
        img.src = editedImage || elements.previewImage?.src || '';
        img.classList.add('image-preview');
        img.addEventListener('click', () => openImageModal(img.src));
        messageDiv.appendChild(img);
        elements.messagesDiv?.appendChild(messageDiv);
        elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;

        const formData = new FormData();
        formData.append('image', selectedFile);
        fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.url) {
                    callRasaAPI(data.url);
                    saveChatHistory(`[Image: ${selectedFile.name} - URL: ${data.url}]`, 'user');
                } else {
                    showErrorMessage('ইমেজ আপলোডে সমস্যা: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(error => showErrorMessage('ইমেজ আপলোডে সমস্যা: ' + error.message));
        clearPreview();
    }
    hideWelcomeMessage();
}

// Updated displayReview Function
function displayReview(reviewData) {
    const reviewCard = document.createElement('div');
    reviewCard.classList.add('review-card', 'slide-in');
    reviewCard.setAttribute('data-editable', 'true');
    reviewCard.setAttribute('data-id', Date.now());
    reviewCard.setAttribute('data-confirmed', 'false');
    reviewCard.innerHTML = '<h3>আপনার তথ্য রিভিউ</h3>';

    const reviewContent = document.createElement('div');
    reviewContent.classList.add('review-content');

    for (const [key, value] of Object.entries(reviewData)) {
        if (key === 'form_type') continue;
        const reviewItem = document.createElement('div');
        reviewItem.classList.add('review-item');
        reviewItem.setAttribute('data-key', key);
        const label = document.createElement('label');
        label.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ') + ':';
        reviewItem.appendChild(label);
        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image'))) {
            const img = document.createElement('img');
            img.src = value;
            reviewItem.appendChild(img);
        } else {
            const p = document.createElement('p');
            p.textContent = value;
            reviewItem.appendChild(p);
        }
        reviewContent.appendChild(reviewItem);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('review-buttons');
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-btn', 'ripple-btn');
    editBtn.textContent = 'Edit';
    const confirmBtn = document.createElement('button');
    confirmBtn.classList.add('confirm-btn', 'ripple-btn');
    confirmBtn.textContent = 'Confirm';
    let isProcessing = false;

    editBtn.addEventListener('click', () => toggleEdit(reviewCard, editBtn, reviewContent, confirmBtn, reviewData));
    confirmBtn.addEventListener('click', async () => {
        if (isProcessing) return;
        isProcessing = true;
        confirmBtn.disabled = true;
        try {
            if (!currentChatId || !currentUserUid) throw new Error('চ্যাট আইডি বা ইউজার পাওয়া যায়নি।');
            const updatedData = {};
            reviewContent.querySelectorAll('.review-item').forEach(item => {
                const key = item.getAttribute('data-key');
                const value = item.querySelector('p')?.textContent || item.querySelector('img')?.src;
                if (value) updatedData[key] = value;
            });
            await db.collection('submissions').add({
                review_data: updatedData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                chat_id: currentChatId,
                uid: currentUserUid
            });
            displayMessage('তথ্য সফলভাবে সংরক্ষিত!', 'bot');
            saveChatHistory('তথ্য সফলভাবে সংরক্ষিত!', 'bot');
            generatePDF(reviewData, reviewCard);
            reviewCard.setAttribute('data-confirmed', 'true');
            reviewCard.setAttribute('data-editable', 'false');
            editBtn.disabled = true;
            editBtn.style.display = 'none';
            confirmBtn.style.display = 'none';
            buttonContainer.innerHTML = '';
            const downloadBtn = document.createElement('button');
            downloadBtn.classList.add('download-btn', 'ripple-btn');
            downloadBtn.textContent = 'Download PDF';
            downloadBtn.addEventListener('click', () => {
                const pdfUrl = reviewCard.getAttribute('data-pdf-url');
                if (pdfUrl) {
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = decodeURIComponent(pdfUrl.split('/').pop());
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    showErrorMessage('পিডিএফ ডাউনলোডের জন্য URL পাওয়া যায়নি।');
                }
            });
            buttonContainer.appendChild(downloadBtn);
        } catch (error) {
            showErrorMessage('তথ্য সংরক্ষণে সমস্যা: ' + error.message);
            confirmBtn.disabled = false;
        } finally {
            isProcessing = false;
        }
    });

    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(confirmBtn);
    reviewCard.appendChild(reviewContent);
    reviewCard.appendChild(buttonContainer);
    elements.messagesDiv?.appendChild(reviewCard);
    elements.messagesDiv.scrollTop = elements.messagesDiv.scrollHeight;
}

// Updated toggleEdit Function
function toggleEdit(reviewCard, editBtn, reviewContent, confirmBtn, reviewData) {
    if (reviewCard.getAttribute('data-confirmed') === 'true') {
        showErrorMessage('ডেটা কনফার্ম হয়ে গেছে। এডিট করা যাবে না।');
        return;
    }
    const isEditable = reviewCard.getAttribute('data-editable') === 'true';
    if (!isEditable) {
        reviewCard.setAttribute('data-editable', 'true');
        editBtn.textContent = 'Save';
        confirmBtn.style.display = 'none';
        reviewContent.querySelectorAll('.review-item').forEach(item => {
            const key = item.getAttribute('data-key');
            const value = item.querySelector('p')?.textContent || item.querySelector('img')?.src;
            item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label>`;
            if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image'))) {
                const img = document.createElement('img');
                img.src = value;
                item.appendChild(img);
                const replaceInput = document.createElement('input');
                replaceInput.type = 'file';
                replaceInput.classList.add('replace-image-input');
                replaceInput.accept = 'image/png, image/jpeg';
                replaceInput.style.display = 'none';
                item.appendChild(replaceInput);
                const replaceIcon = document.createElement('i');
                replaceIcon.classList.add('fas', 'fa-camera', 'replace-image-icon');
                item.appendChild(replaceIcon);
                replaceIcon.addEventListener('click', () => replaceInput.click());
                replaceInput.addEventListener('change', () => {
                    const file = replaceInput.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = e => img.src = e.target.result;
                        reader.onerror = () => showErrorMessage('ইমেজ লোডে সমস্যা।');
                        reader.readAsDataURL(file);
                    }
                });
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
                item.innerHTML = `<label>${sanitizeMessage(key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '))}:</label><img src="${img.src}" />`;
            }
        });
        reviewCard.setAttribute('data-editable', 'false');
        editBtn.textContent = 'Edit';
        confirmBtn.style.display = 'inline-block';
        Object.assign(reviewData, updatedData);
    }
}

// Updated generatePDF Function
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
                displayMessage('PDF তৈরি ও আপলোড সফল!', 'bot');
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
    elements.historyIcon?.addEventListener('click', toggleSidebar);
    elements.closeSidebar?.addEventListener('click', closeSidebarHandler);
    elements.newChatIcon?.addEventListener('click', startNewChat);
    elements.searchInput?.addEventListener('input', () => loadChatHistory(elements.searchInput.value.trim()));
    elements.cancelDelete?.addEventListener('click', () => elements.deleteModal.style.display = 'none');
    elements.confirmDelete?.addEventListener('click', deleteChat);
    elements.cancelRename?.addEventListener('click', () => elements.renameModal.style.display = 'none');
    elements.saveRename?.addEventListener('click', renameChat);
    elements.sendBtn?.addEventListener('click', sendMessage);
    elements.userInput?.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.repeat) sendMessage();
    });
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
    elements.previewImage?.addEventListener('click', () => {
        elements.reviewImage.src = elements.previewImage.src;
        elements.imageReviewModal.style.display = 'block';
    });
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
    elements.cropX?.addEventListener('input', e => { cropRect.x = parseInt(e.target.value); drawImage(); });
    elements.cropY?.addEventListener('input', e => { cropRect.y = parseInt(e.target.value); drawImage(); });
    elements.cropWidth?.addEventListener('input', e => { cropRect.width = parseInt(e.target.value); drawImage(); });
    elements.cropHeight?.addEventListener('input', e => { cropRect.height = parseInt(e.target.value); drawImage(); });
    elements.brightness?.addEventListener('input', e => { brightnessValue = parseInt(e.target.value); drawImage(); });
    elements.contrast?.addEventListener('input', e => { contrastValue = parseInt(e.target.value); drawImage(); });
    elements.backgroundColor?.addEventListener('change', e => { bgColor = e.target.value; drawImage(); });
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
    elements.imageReviewModal?.addEventListener('click', e => {
        if (e.target === elements.imageReviewModal || e.target === elements.deleteImageBtn) {
            elements.imageReviewModal.style.display = 'none';
        }
    });
    elements.deleteImageBtn?.addEventListener('click', () => {
        clearPreview();
        elements.imageReviewModal.style.display = 'none';
    });
    elements.moreOptionsBtn?.addEventListener('click', openGenresModal);
    elements.closeGenresModal?.addEventListener('click', closeGenresModal);
    document.querySelectorAll('.welcome-buttons button[data-genre]').forEach(button => {
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
