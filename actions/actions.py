version: "3.1"

intents:
  - inform
  - apply_nid
  - apply_nid_english
  - affirm
  - request_edit
  - cancel_application
  - cancel_application_english

entities:
  - name
  - father_name
  - address
  - dob
  - name_english
  - father_name_english
  - address_english
  - dob_english

slots:
  name:
    type: text
    mappings:
    - type: from_text
      conditions:
      - active_loop: nid_application_form
        requested_slot: name
  father_name:
    type: text
    mappings:
    - type: from_text
      conditions:
      - active_loop: nid_application_form
        requested_slot: father_name
  address:
    type: text
    mappings:
    - type: from_text
      conditions:
      - active_loop: nid_application_form
        requested_slot: address
  dob:
    type: text
    mappings:
    - type: from_text
      conditions:
      - active_loop: nid_application_form
        requested_slot: dob
  image_slot:
    type: text
    influence_conversation: false
    mappings:
    - type: from_text
      conditions:
      - active_loop: nid_application_form
        requested_slot: image_slot
  name_english:
    type: text
    mappings:
    - type: from_text
      conditions:
      - active_loop: nid_application_form_english
        requested_slot: name_english
  father_name_english:
    type: text
    mappings:
    - type: from_text
      conditions:
      - active_loop: nid_application_form_english
        requested_slot: father_name_english
  address_english:
    type: text
    mappings:
    - type: from_text
      conditions:
      - active_loop: nid_application_form_english
        requested_slot: address_english
  dob_english:
    type: text
    mappings:
    - type: from_text
      conditions:
      - active_loop: nid_application_form_english
        requested_slot: dob_english
  image_slot_english:
    type: text
    influence_conversation: false
    mappings:
    - type: from_text
      conditions:
      - active_loop: nid_application_form_english
        requested_slot: image_slot_english
  lang:
    type: text
    influence_conversation: true
    mappings:
    - type: from_intent
      value: "bangla"
      intent: apply_nid
    - type: from_intent
      value: "english"
      intent: apply_nid_english

responses:
# Bangla
  utter_ask_name:
    - text: "আপনার নাম বাংলায় শুদ্ধ করে লিখুন। (উদাহরণ: মোহাম্মদ শিহাব)।  
            শুধু আপনার নাম লিখুন। অন্য কিছু লিখবেন না।"
  utter_ask_father_name:
    - text: "আপনার বাবার নাম লিখুন। (উদাহরণ: আব্দুল কাদের)।  
            শুধু আপনার বাবার নাম লিখুন। অন্য কিছু লিখবেন না।"
  utter_ask_address:
    - text: "আপনার ঠিকানা লিখুন। (উদাহরণ: ঢাকা, বাংলাদেশ)।  
            শুধু আপনার ঠিকানা লিখুন। অন্য কিছু লিখবেন না।"
  utter_ask_dob:
    - text: "আপনার জন্মতারিখ লিখুন। (উদাহরণ: ১২-০৩-১৯৯৫)।  
            শুধু আপনার জন্মতারিখ লিখুন। দয়া করে day-month-year ফরম্যাটে লিখুন।"
  utter_ask_image_slot:
    - text: "দয়া করে আপনার ডকুমেন্টের ইমেজ আপলোড করুন (যেমন, NID, পাসপোর্ট)।"
  utter_nid_application_complete:
    - text: "ধন্যবাদ! আপনার এনআইডি আবেদন সম্পন্ন হয়েছে।"
  utter_application_cancelled:
    - text: "আপনার আবেদন বাতিল করা হয়েছে। নতুন করে শুরু করতে বলুন 'আমি এনআইডি আবেদন করতে চাই'।"
# English 
  utter_ask_name_english:
    - text: "Write your name properly. (example: Mohammad Shihab)  
            Just write your name."
  utter_ask_father_name_english:
    - text: "Write your father's name (example: Abdul Kader).  
            Just write your father's name."
  utter_ask_address_english:
    - text: "Write your address (example: Dhaka, Bangladesh).  
            Just write your address."
  utter_ask_dob_english:
    - text: "Write your date of birth (example: 12-03-1995).  
            Just write your date of birth in the format day-month-year."
  utter_ask_image_slot_english:
    - text: "Please upload an image of your document (e.g., NID, passport). এটি আপনি এডিট পেজে আপলোড করতে পারবেন।"
  utter_nid_application_complete_english:
    - text: "Thank you! Your NID application is complete."
  utter_application_cancelled_english:
    - text: "Application cancelled. You can start again by saying 'I want to apply for an NID'."
# Review and PDF Responses
  utter_review_data:
    - text: "Please review your data here: {review_url}\nSay 'হ্যাঁ' if correct, or click 'Edit' to modify."
  utter_review_data_english:
    - text: "Please review your data here: {review_url}\nSay 'Yes' if correct, or click 'Edit' to modify."
  utter_pdf_generated:
    - text: "PDF generated! Download here: {pdf_url}"
  utter_pdf_generated_english:
    - text: "PDF generated! Download here: {pdf_url}"
  utter_edit:
    - text: "Click here to edit: {edit_url}"
  utter_edit_english:
    - text: "Click here to edit: {edit_url}"

forms:
  nid_application_form:
    required_slots:
      - name
      - father_name
      - address
      - dob
      - image_slot
  nid_application_form_english:
    required_slots:
      - name_english
      - father_name_english
      - address_english
      - dob_english
      - image_slot_english

actions:
  - action_send_to_firebase
  - action_review_data
  - action_generate_pdf
  - action_reset_slots
  - action_cancel_application
