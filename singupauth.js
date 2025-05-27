// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const errorMessage = document.getElementById('error-message');
    const googleSignUp = document.getElementById('googleSignUp');
    const facebookSignUp = document.getElementById('facebookSignUp');

    // Email/Phone Signup
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const displayName = document.getElementById('displayName').value;
            const emailOrPhone = document.getElementById('emailOrPhone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                errorMessage.textContent = 'পাসওয়ার্ড মিলছে না।';
                errorMessage.style.display = 'block';
                return;
            }

            try {
                let userCredential;
                if (emailOrPhone.includes('@')) {
                    // Email Signup
                    userCredential = await auth.createUserWithEmailAndPassword(emailOrPhone, password);
                } else {
                    // Phone Signup (requires reCAPTCHA, simplified for prototype)
                    errorMessage.textContent = 'ফোন নম্বর সাইন আপ এখনো সাপোর্টেড নয়। ইমেইল ব্যবহার করুন।';
                    errorMessage.style.display = 'block';
                    return;
                }

                const user = userCredential.user;
                await user.updateProfile({ displayName });

                // Save user data to Firestore
                await db.collection('users').doc(user.uid).set({
                    displayName,
                    email: emailOrPhone.includes('@') ? emailOrPhone : null,
                    phoneNumber: !emailOrPhone.includes('@') ? emailOrPhone : null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                window.location.href = 'login.html';
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
            }
        });
    }

    // Google Signup
    if (googleSignUp) {
        googleSignUp.addEventListener('click', async () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                const result = await auth.signInWithPopup(provider);
                const user = result.user;

                // Save user data to Firestore
                await db.collection('users').doc(user.uid).set({
                    displayName: user.displayName,
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                window.location.href = 'index.html';
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
            }
        });
    }

    // Facebook Signup
    if (facebookSignUp) {
        facebookSignUp.addEventListener('click', async () => {
            const provider = new firebase.auth.FacebookAuthProvider();
            try {
                const result = await auth.signInWithPopup(provider);
                const user = result.user;

                // Save user data to Firestore
                await db.collection('users').doc(user.uid).set({
                    displayName: user.displayName,
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                window.location.href = 'index.html';
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
            }
        });
    }
});
