import firebase_admin
from firebase_admin import credentials, db
from rasa_sdk import Action
from rasa_sdk.events import SlotSet
import time

# ফায়ারবেজ ইনিশিয়ালাইজ করা
cred = credentials.Certificate("C:/Users/Md Shihabur Rahaman/Downloads/ocr/admissionformdb-firebase-adminsdk-fbsvc-8405202f56.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://admissionformdb-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

class ActionSendToFirebase(Action):
    def name(self):
        return "action_send_to_firebase"

    def run(self, dispatcher, tracker, domain):
        # ট্র্যাকার থেকে সব স্লটের ডাটা নেওয়া
        all_slots = tracker.slots

        # প্রত্যাশিত স্লটগুলোর লিস্ট (ধরে নিচ্ছি এগুলো ফর্মের জন্য প্রয়োজনীয় ফিল্ড)
        expected_slots = ["name", "age", "address", "phone"]  # এই লিস্টটি তোমার ফর্ম অনুযায়ী পরিবর্তন করতে পারো

        # একটা খালি ডিকশনারি তৈরি করা যেখানে শুধু পূরণ করা স্লটগুলো রাখব
        data_to_send = {}

        # সব স্লট চেক করা
        for slot_name, slot_value in all_slots.items():
            if slot_value:  # যদি স্লটে ভ্যালু থাকে
                data_to_send[slot_name] = slot_value

        # যদি কোনো ডাটা না থাকে, তাহলে ইউজারকে স্পষ্টভাবে জানানো
        if not data_to_send:
            missing_slots = [slot for slot in expected_slots if slot not in data_to_send or not data_to_send.get(slot)]
            if missing_slots:
                missing_slots_str = ", ".join(missing_slots)
                dispatcher.utter_message(
                    text=f"দুঃখিত, কিছু তথ্য পাওয়া যায়নি। দয়া করে নিম্নলিখিত তথ্যগুলো প্রদান করুন: {missing_slots_str}।"
                )
            else:
                dispatcher.utter_message(text="দুঃখিত, কোনো তথ্য পাওয়া যায়নি। দয়া করে আপনার তথ্য প্রদান করুন।")
            return []

        # টাইমস্ট্যাম্প যোগ করা (মিলিসেকেন্ডে)
        data_to_send["timestamp"] = int(time.time() * 1000)

        # ফায়ারবেজ রিয়েলটাইম ডাটাবেসে ডাটা পাঠানো
        try:
            ref = db.reference('rasa_data')
            new_entry = ref.push(data_to_send)
            dispatcher.utter_message(text="ডাটা সফলভাবে পাঠানো হয়েছে!")
        except Exception as e:
            dispatcher.utter_message(text="ডাটা পাঠাতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।")
            return []

        # স্লট রিসেট করা
        reset_events = []
        for slot_name in all_slots.keys():
            reset_events.append(SlotSet(slot_name, None))

        return reset_events
