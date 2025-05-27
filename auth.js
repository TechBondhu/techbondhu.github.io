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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
        const userCredential = await auth.createUserWithEmailAndPassword(emailOrPhone, password);
        const user = userCredential.user;
        await user.updateProfile({ displayName });

        await db.collection('users').doc(user.uid).set({
            displayName,
            email: emailOrPhone,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
        await auth.signInWithEmailAndPassword(emailOrPhone, password);
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

            await db.collection('passwordResetCodes').doc(emailOrPhone).set({
                code,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Verification Code for ${emailOrPhone}: ${code}`);
            displaySuccess('ভেরিফিকেশন কোড আপনার ইমেইলে পাঠানো হয়েছে।');
        } else {
            const phoneNumber = emailOrPhone;
            const appVerifier = new firebase.auth.RecaptchaVerifier('sendCodeForm', {
                'size': 'invisible'
            });

            const result = await auth.signInWithPhoneNumber(phoneNumber, appVerifier);
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
            const codeDoc = await db.collection('passwordResetCodes').doc(emailForReset).get();
            if (!codeDoc.exists || codeDoc.data().code !== code) {
                throw new Error('ভুল কোড। দয়া করে সঠিক কোডটি লিখুন।');
            }

            await db.collection('passwordResetCodes').doc(emailForReset).delete();
            window.location.href = `update-password.html?email=${encodeURIComponent(emailForReset)}`;
        } else {
            const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, code);
            await auth.signInWithCredential(credential);
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
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');

        if (email) {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('ইউজার লগইন করা নেই। দয়া করে লগইন করুন।');
            }
            await user.updatePassword(newPassword);
        } else {
            const user = auth.currentUser;
            await user.updatePassword(newPassword);
        }

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
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        await db.collection('users').doc(user.uid).set({
            displayName: user.displayName,
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        window.location.href = 'login.html';
    } catch (error) {
        displayError(error.message);
    }
});

document.getElementById('googleSignIn')?.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        window.location.href = 'chat.html';
    } catch (error) {
        displayError(error.message);
    }
});

// Facebook Sign-In
document.getElementById('facebookSignUp')?.addEventListener('click', async () => {
    const provider = new firebase.auth.FacebookAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        await db.collection('users').doc(user.uid).set({
            displayName: user.displayName,
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        window.location.href = 'login.html';
    } catch (error) {
        displayError(error.message);
    }
});

document.getElementById('facebookSignIn')?.addEventListener('click', async () => {
    const provider = new firebase.auth.FacebookAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        window.location.href = 'chat.html';
    } catch (error) {
        displayError(error.message);
    }
});
