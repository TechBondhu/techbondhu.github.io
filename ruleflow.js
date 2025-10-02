// ruleflow.js

// Firebase SDK (ইতিমধ্যে chat.js-এ ইনিশিয়ালাইজ করা আছে বলে ধরে নিচ্ছি)
const db = firebase.firestore();
const storage = firebase.storage();

// ফ্লো ডিফিনিশন
export const flows = {
  // NID Apply Flow
  nid_apply: {
    start: {
      question: "আপনার কাছে কি জন্ম নিবন্ধন এবং এসএসসি মার্কশিট আছে?",
      type: "yesno",
      yes: "upload_docs",
      no: "nid_long_form"
    },
    upload_docs: {
      question: "দয়া করে জন্ম নিবন্ধন এবং এসএসসি মার্কশিট আপলোড করুন।",
      type: "file",
      next: "nid_short_form"
    },
    nid_short_form: {
      question: "দয়া করে আপনার মোবাইল নাম্বার লিখুন:",
      type: "text",
      next: "review"
    },
    nid_long_form: {
      question: "আপনার পূর্ণ নাম লিখুন:",
      type: "text",
      next: "father_name"
    },
    father_name: {
      question: "আপনার বাবার নাম লিখুন:",
      type: "text",
      next: "mother_name"
    },
    mother_name: {
      question: "আপনার মায়ের নাম লিখুন:",
      type: "text",
      next: "dob"
    },
    dob: {
      question: "আপনার জন্ম তারিখ লিখুন (DD-MM-YYYY):",
      type: "text",
      next: "address"
    },
    address: {
      question: "আপনার বর্তমান ঠিকানা লিখুন:",
      type: "text",
      next: "review"
    },
    review: { type: "review", form_type: "nid" }
  },

  // Passport Apply Flow
  passport_apply: {
    start: {
      question: "আপনার কাছে কি NID এবং পাসপোর্ট সাইজের ছবি আছে?",
      type: "yesno",
      yes: "upload_passport_docs",
      no: "passport_long_form"
    },
    upload_passport_docs: {
      question: "দয়া করে আপনার NID এবং পাসপোর্ট সাইজের ছবি আপলোড করুন।",
      type: "file",
      next: "passport_short_form"
    },
    passport_short_form: {
      question: "আপনার পাসপোর্টের উদ্দেশ্য কী? (যেমন: ভ্রমণ, চাকরি, শিক্ষা)",
      type: "text",
      next: "review"
    },
    passport_long_form: {
      question: "আপনার পূর্ণ নাম লিখুন:",
      type: "text",
      next: "passport_dob"
    },
    passport_dob: {
      question: "আপনার জন্ম তারিখ লিখুন (DD-MM-YYYY):",
      type: "text",
      next: "nationality"
    },
    nationality: {
      question: "আপনার জাতীয়তা লিখুন (যেমন: বাংলাদেশী):",
      type: "text",
      next: "permanent_address"
    },
    permanent_address: {
      question: "আপনার স্থায়ী ঠিকানা লিখুন:",
      type: "text",
      next: "review"
    },
    review: { type: "review", form_type: "passport" }
  }
};

// ফ্লো ট্র্যাকিং ভ্যারিয়েবল
let activeFlow = null;
let currentStep = null;
let userData = {};
let userId = firebase.auth().currentUser?.uid || 'anonymous';
let chatId = localStorage.getItem('leftChatId') || null;

// ফ্লো শুরু করার ফাংশন
export function startFlow(flowName, displayMessage) {
  activeFlow = flows[flowName];
  currentStep = "start";
  userData = { form_type: activeFlow.review.form_type }; // ফর্ম টাইপ সেট করা
  displayMessage(activeFlow[currentStep].question, 'bot', 'left');
}

// ফাইল আপলোড ফাংশন (Flask /upload এন্ডপয়েন্ট ব্যবহার করে)
async function uploadFile(file, displayMessage) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (response.ok) {
      displayMessage("ইমেজ সফলভাবে আপলোড হয়েছে!", 'bot', 'left');
      return result.url;
    } else {
      throw new Error(result.error || "ইমেজ আপলোড ব্যর্থ।");
    }
  } catch (error) {
    displayMessage("ইমেজ আপলোডে সমস্যা: " + error.message, 'bot', 'left');
    return null;
  }
}

// ফ্লো হ্যান্ডলার ফাংশন
export async function handleFormFlow(userMessage, displayMessage, displayReview, file = null) {
  if (!activeFlow || !currentStep) {
    displayMessage("কোনো ফ্লো সক্রিয় নেই। দয়া করে নতুন ফ্লো শুরু করুন।", 'bot', 'left');
    return;
  }

  const step = activeFlow[currentStep];

  // ফাইল আপলোড হ্যান্ডল করা
  if (step.type === "file" && file) {
    const fileUrl = await uploadFile(file, displayMessage);
    if (fileUrl) {
      userData[currentStep] = fileUrl;
      await saveToFirestore(userData, "drafts");
      currentStep = step.next;
    } else {
      return; // আপলোড ব্যর্থ হলে থামুন
    }
  } else if (step.type === "text" || step.type === "yesno") {
    userData[currentStep] = userMessage;
    await saveToFirestore(userData, "drafts");
    if (step.type === "yesno") {
      currentStep = (userMessage.toLowerCase() === "হ্যাঁ" || userMessage.toLowerCase() === "yes") ? step.yes : step.no;
    } else {
      currentStep = step.next;
    }
  } else if (step.type === "review") {
    displayReview(userData, 'left');
    return;
  }

  const nextStep = activeFlow[currentStep];
  if (nextStep && nextStep.question) {
    displayMessage(nextStep.question, 'bot', 'left');
  }
}

// রিভিউ কনফার্ম করার ফাংশন
export async function confirmFlow(displayMessage, displayReview, side) {
  if (!userData || !activeFlow || !chatId) {
    displayMessage("আবেদন জমা দিতে সমস্যা: ডেটা বা ফ্লো পাওয়া যায়নি।", 'bot', 'left');
    return;
  }

  try {
    // Firebase-এ চূড়ান্ত ডেটা সেভ
    await saveToFirestore(userData, "applications");

    // Flask /generate-pdf এন্ডপয়েন্টে রিকোয়েস্ট পাঠানো
    const response = await fetch('http://localhost:5000/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewData: userData,
        form_type: userData.form_type,
        chat_id: chatId
      })
    });

    const result = await response.json();
    if (response.ok && result.success) {
      displayMessage("আপনার আবেদন সফলভাবে জমা হয়েছে!", 'bot', 'left');
      displayMessage(`আপনার আবেদন ফর্মের PDF ডাউনলোড করুন: ${result.pdf_url}`, 'bot', 'left');
      userData.pdf_url = result.pdf_url; // PDF URL ডেটাতে যোগ করা
      await saveToFirestore(userData, "applications"); // PDF URL সহ আপডেট
      displayReview(userData, 'left'); // আপডেটেড রিভিউ দেখানো
    } else {
      throw new Error(result.error || "PDF তৈরি ব্যর্থ।");
    }
  } catch (error) {
    displayMessage("আবেদন জমা দিতে সমস্যা: " + error.message, 'bot', 'left');
  } finally {
    // ফ্লো রিসেট
    activeFlow = null;
    currentStep = null;
    userData = {};
  }
}

// Firebase-এ ডেটা সেভ করার ফাংশন
async function saveToFirestore(data, collectionName) {
  try {
    const docRef = await db.collection(collectionName).add({
      userId: userId,
      chatId: chatId,
      formData: data,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Data saved to ${collectionName} with ID: ${docRef.id}`);
  } catch (error) {
    console.error("Error saving to Firestore:", error);
    throw error;
  }
}
