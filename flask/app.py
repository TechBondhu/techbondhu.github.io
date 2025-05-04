from flask import Flask, request, jsonify
from flask_cors import CORS
import cloudinary
import cloudinary.uploader

app = Flask(__name__)
CORS(app)  # CORS এনেবল করা

# Cloudinary কনফিগারেশন
cloudinary.config(
    cloud_name="dsgz8jaue",   
    api_key="981588186852239",
    api_secret="qDk1d2QwwzE-0EeepmWj4VsaTv0",
)

@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "কোনো ফাইল পাওয়া যায়নি!"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "কোনো ফাইল নির্বাচন করা হয়নি!"}), 400

        # Cloudinary-তে ফাইল আপলোড
        upload_result = cloudinary.uploader.upload(file, folder="registration_images")
        image_url = upload_result.get("secure_url")

        return jsonify({"url": image_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
