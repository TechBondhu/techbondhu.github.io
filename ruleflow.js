// ruleflow.js

// সব ফ্লো এখানে ডিফাইন করা হবে
export const flows = {
  nid_apply: {
    start: {
      question: "আপনার কাছে কি Birth Registration এবং SSC Marksheet আছে?",
      type: "yesno",
      yes: "upload_docs",
      no: "nid_long_form"
    },
    upload_docs: {
      question: "দয়া করে Birth Registration এবং SSC Marksheet আপলোড করুন।",
      type: "file",
      next: "nid_short_form"
    },
    nid_short_form: {
      question: "দয়া করে আপনার মোবাইল নাম্বার লিখুন:",
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
      question: "আপনার মায়ের নাম লিখুন:",
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
    review: { type: "review" }
  }
};

// ফ্লো ট্র্যাকিং ভ্যারিয়েবল
let activeFlow = null;
let currentStep = null;
let userData = {};

// ফ্লো শুরু করার ফাংশন
export function startFlow(flowName, displayMessage) {
  activeFlow = flows[flowName];
  currentStep = "start";
  userData = {};
  displayMessage(activeFlow[currentStep].question, 'bot', 'left');
}

// ফ্লো হ্যান্ডলার
export function handleFormFlow(userMessage, displayMessage, displayReview) {
  if (!activeFlow || !currentStep) return;

  const step = activeFlow[currentStep];

  // উত্তর সেভ করা
  if (step.type === "text" || step.type === "yesno") {
    userData[currentStep] = userMessage;
  }

  // লজিক
  if (step.type === "yesno") {
    if (userMessage === "হ্যাঁ" || userMessage.toLowerCase() === "yes") {
      currentStep = step.yes;
    } else {
      currentStep = step.no;
    }
  } else if (step.type === "file") {
    userData[currentStep] = "[Uploaded File]";
    currentStep = step.next;
  } else if (step.type === "text") {
    currentStep = step.next;
  } else if (step.type === "review") {
    displayReview(userData, 'left');
    return;
  }

  const nextStep = activeFlow[currentStep];
  if (nextStep && nextStep.question) {
    displayMessage(nextStep.question, 'bot', 'left');
  }
}
