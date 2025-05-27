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
