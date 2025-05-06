from flask import Flask, render_template_string, request, redirect, url_for
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField
from wtforms.validators import DataRequired
import firebase_admin
from firebase_admin import credentials, db
import requests
import pdfkit
import cloudinary
import cloudinary.uploader
import cloudinary.api
import tempfile
import os
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24).hex()

# Firebase সেটআপ
cred = credentials.Certificate("J:/Review and Pdf/credentials.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://admissionformdb-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

# Cloudinary সেটআপ
cloudinary.config(
    cloud_name="dsgz8jaue",   
    api_key="981588186852239",
    api_secret="qDk1d2QwwzE-0EeepmWj4VsaTv0",
)

# GitHub Pages-এর টেমপ্লেট URL
GITHUB_PAGES_BASE_URL = "https://github.com/TechBondhu/techbondhu.github.io/tree/main/templates"

# wkhtmltopdf পাথ কনফিগারেশন
config = pdfkit.configuration(wkhtmltopdf="C:/Program Files/wkhtmltopdf/bin/wkhtmltopdf.exe")

class DynamicForm(FlaskForm):
    submit = SubmitField('Confirm')

def fetch_template(template_name, context):
    template_url = f"{GITHUB_PAGES_BASE_URL}{template_name}"
    response = requests.get(template_url)
    if response.status_code != 200:
        return f"Error fetching template {template_name}", 500
    return render_template_string(response.text, **context)

@app.route('/review/<user_id>')
def review(user_id):
    try:
        rasa_endpoint = f"http://localhost:5005/conversations/{user_id}/tracker"
        response = requests.get(rasa_endpoint)
        tracker = response.json()
        slots = {k: v for k, v in tracker.get('slots', {}).items() if v is not None}
    except Exception as e:
        return f"Error fetching slots: {str(e)}", 500
    return fetch_template('review.html', {'user_id': user_id, 'slots': slots})

@app.route('/edit/<user_id>', methods=['GET', 'POST'])
def edit(user_id):
    try:
        rasa_endpoint = f"http://localhost:5005/conversations/{user_id}/tracker"
        response = requests.get(rasa_endpoint)
        tracker = response.json()
        slots = {k: v for k, v in tracker.get('slots', {}).items() if v is not None}
    except Exception as e:
        return f"Error fetching slots: {str(e)}", 500

    form = DynamicForm()
    for slot_name, slot_value in slots.items():
        if slot_name not in ['image_slot_english', 'lang']:
            setattr(DynamicForm, slot_name, StringField(slot_name, default=slot_value, validators=[DataRequired()]))

    if form.validate_on_submit():
        try:
            # ইমেজ আপলোড
            image_url = None
            if 'image' in request.files and request.files['image']:
                file = request.files['image']
                upload_result = cloudinary.uploader.upload(file, resource_type="image")
                image_url = upload_result['secure_url']

            # Rasa স্লট রিসেট
            rasa_reset_endpoint = f"http://localhost:5005/conversations/{user_id}/tracker/events"
            reset_payload = [{"event": "slot", "name": name, "value": None} for name in slots.keys()]
            requests.post(rasa_reset_endpoint, json=reset_payload)

            # নতুন ডেটা সেট
            update_payload = [{"event": "slot", "name": name, "value": form.data[name]} for name in slots.keys() if name not in ['submit', 'image_slot_english', 'lang']]
            if image_url:
                update_payload.append({"event": "slot", "name": "image_slot_english", "value": image_url})
            requests.post(rasa_reset_endpoint, json=update_payload)

            return redirect(url_for('generate_pdf', user_id=user_id))
        except Exception as e:
            return f"Error updating slots or uploading image: {str(e)}", 500

    return fetch_template('edit.html', {'form': form, 'user_id': user_id})

@app.route('/generate_pdf/<user_id>')
def generate_pdf(user_id):
    try:
        rasa_endpoint = f"http://localhost:5005/conversations/{user_id}/tracker"
        response = requests.get(rasa_endpoint)
        tracker = response.json()
        slots = {k: v for k, v in tracker.get('slots', {}).items() if v is not None}
    except Exception as e:
        return f"Error fetching slots: {str(e)}", 500

    try:
        ref = db.reference(f'rasa_data/{user_id}')
        slots['timestamp'] = int(time.time() * 1000)
        ref.set(slots)
    except Exception as e:
        return f"Error saving to Firebase: {str(e)}", 500

    html_content = fetch_template('pdf_template.html', {'slots': slots})
    if isinstance(html_content, tuple):
        return html_content  # Error case
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf:
            # wkhtmltopdf কনফিগারেশন সহ PDF জেনারেট করো
            pdfkit.from_string(html_content, temp_pdf.name, configuration=config)
            upload_result = cloudinary.uploader.upload(temp_pdf.name, resource_type="raw")
            pdf_url = upload_result['secure_url']
        os.unlink(temp_pdf.name)
    except Exception as e:
        return f"Error generating or uploading PDF: {str(e)}", 500

    return fetch_template('download.html', {'user_id': user_id, 'pdf_path': pdf_url})

if __name__ == '__main__':
    app.run(debug=True)
