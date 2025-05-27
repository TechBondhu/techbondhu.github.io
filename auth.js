import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup, PhoneAuthProvider, signInWithCredential, updatePassword } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, serverTimestamp, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { FacebookAuthProvider } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoIdMx9Zd7kQt9MSZmowbphaQVRl8D16E",
  authDomain: "admissionformdb.firebaseapp.com",
  projectId: "admissionformdb",
  storageBucket: "admissionformdb.firebasestorage.app",
  messagingSenderId: "398052082157",
  appId: "1:398052082157:web:0bc02d66cbdf55dd2567e4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Utility to display error messages
function displayError(message) {
    const errorMessageElement = document.getElementById('error-message');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
}

// Utility to display success messages
function displaySuccess(message) {
    const successMessageElement = document.getElementById('success-message');
    if (successMessageElement) {
        successMessageElement.textContent = message;
    }
}

// Sign Up Functionality
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const displayName = document.getElementById('displayName').value;
    const emailOrPhone = document.getElementById('emailOrPhone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        displayError('পাসওয়ার্ড মিলছে না।');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailOrPhone, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName });

        await setDoc(doc(db, 'users', user.uid), {
            displayName,
            email: emailOrPhone,
            createdAt: serverTimestamp()
        });

        // Redirect to login page after signup
        window.location.href = 'login.html';
    } catch (error) {
        displayError(error.message);
    }
});

// Login Functionality
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailOrPhone = document.getElementById('emailOrPhone').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, emailOrPhone, password);
        // Redirect to chat page after login
        window.location.href = 'chat.html';
    } catch (error) {
        displayError(error.message);
    }
});

// Password Reset Functionality - Send Verification Code
let verificationId = '';
let emailForReset = '';

document.getElementById('sendCodeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailOrPhone = document.getElementById('emailOrPhone').value;

    try {
        if (emailOrPhone.includes('@')) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            emailForReset = emailOrPhone;

            await setDoc(doc(db, 'passwordResetCodes', emailOrPhone), {
                code,
                createdAt: serverTimestamp()
            });

            console.log(`Verification Code for ${emailOrPhone}: ${code}`);
            displaySuccess('ভেরিফিকেশন কোড আপনার ইমেইলে পাঠানো হয়েছে।');
        } else {
            const phoneNumber = '+88' + emailOrPhone; // Assuming Bangladesh country code
            const appVerifier = new RecaptchaVerifier('sendCodeForm', {
                'size': 'invisible'
            }, auth);

            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            verificationId = result.verificationId;
            displaySuccess('ভেরিফিকেশন কোড আপনার ফোনে পাঠানো হয়েছে।');
        }

        document.getElementById('sendCodeForm').style.display = 'none';
        document.getElementById('verifyCodeForm').style.display = 'block';
    } catch (error) {
        displayError(error.message);
    }
});

// Verify Code and Redirect to Update Password
document.getElementById('verifyCodeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('verificationCode').value;

    try {
        if (emailForReset) {
            const codeDoc = await getDoc(doc(db, 'passwordResetCodes', emailForReset));
            if (!codeDoc.exists() || codeDoc.data().code !== code) {
                throw new Error('ভুল কোড। দয়া করে সঠিক কোডটি লিখুন।');
            }

            await deleteDoc(doc(db, 'passwordResetCodes', emailForReset));
            window.location.href = `update-password.html?email=${encodeURIComponent(emailForReset)}`;
        } else {
            const credential = PhoneAuthProvider.credential(verificationId, code);
            await signInWithCredential(auth, credential);
            window.location.href = 'update-password.html';
        }
    } catch (error) {
        displayError(error.message);
    }
});

// Update Password Functionality
document.getElementById('updatePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
        displayError('পাসওয়ার্ড মিলছে না।');
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('ইউজার লগইন করা নেই। দয়া করে লগইন করুন।');
        }
        await updatePassword(user, newPassword);

        displaySuccess('পাসওয়ার্ড সফলভাবে আপডেট হয়েছে।');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        displayError(error.message);
    }
});

// Google Sign-In
document.getElementById('googleSignUp')?.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        await setDoc(doc(db, 'users', user.uid), {
            displayName: user.displayName,
            email: user.email,
            createdAt: serverTimestamp()
        }, { merge: true });

        window.location.href = 'login.html';
    } catch (error) {
        displayError(error.message);
    }
});

document.getElementById('googleSignIn')?.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        window.location.href = 'chat.html';
    } catch (error) {
        displayError(error.message);
    }
});

// Facebook Sign-In
document.getElementById('facebookSignUp')?.addEventListener('click', async () => {
    const provider = new FacebookAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        await setDoc(doc(db, 'users', user.uid), {
            displayName: user.displayName,
            email: user.email,
            createdAt: serverTimestamp()
        }, { merge: true });

        window.location.href = 'login.html';
    } catch (error) {
        displayError(error.message);
    }
});

document.getElementById('facebookSignIn')?.addEventListener('click', async () => {
    const provider = new FacebookAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        window.location.href = 'chat.html';
    } catch (error) {
        displayError(error.message);
    }
});

// Export auth and db for use in other files
export { auth, db };
