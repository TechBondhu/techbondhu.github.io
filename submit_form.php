<?php
$servername = "sql305.infinityfree.com";
$username = "if0_38363783";
$password = "84F30XeGbvr8";
$database = "if0_38363783_student_info";

// ডাটাবেজ কানেকশন
$conn = new mysqli($servername, $username, $password, $database);

// কানেকশন চেক
if ($conn->connect_error) {
    die("❌ Connection failed: " . $conn->connect_error);
}

// ফর্ম থেকে ডাটা নেওয়া (SQL Injection প্রতিরোধের জন্য)
$name = $conn->real_escape_string($_POST['name']);
$father_name = $conn->real_escape_string($_POST['father_name']);
$mother_name = $conn->real_escape_string($_POST['mother_name']);
$dob = $_POST['dob'];
$gender = $_POST['gender'];
$blood_group = $_POST['blood_group'];
$email = $conn->real_escape_string($_POST['email']);
$phone = $conn->real_escape_string($_POST['phone']);
$address = $conn->real_escape_string($_POST['address']);
$permanent_address = $conn->real_escape_string($_POST['permanent_address']);
$school = $conn->real_escape_string($_POST['school']);
$exam_name = $_POST['exam_name'];
$roll = $conn->real_escape_string($_POST['roll']);
$reg = $conn->real_escape_string($_POST['reg']);
$board = $_POST['board'];
$gpa = $conn->real_escape_string($_POST['gpa']);
$guardian_phone = $conn->real_escape_string($_POST['guardian_phone']);
$guardian_job = $conn->real_escape_string($_POST['guardian_job']);

// 🟢 ছবি এবং স্বাক্ষর আপলোড (ফাইল প্রসেসিং)
$photo_name = $_FILES['photo']['name'];
$photo_tmp_name = $_FILES['photo']['tmp_name'];
$signature_name = $_FILES['signature']['name'];
$signature_tmp_name = $_FILES['signature']['tmp_name'];

// ফাইল আপলোড লোকেশন
$upload_dir = "uploads/";
$photo_path = $upload_dir . basename($photo_name);
$signature_path = $upload_dir . basename($signature_name);

// ফাইল সার্ভারে আপলোড
move_uploaded_file($photo_tmp_name, $photo_path);
move_uploaded_file($signature_tmp_name, $signature_path);

// ✅ Prepared Statement দিয়ে SQL Query
$stmt = $conn->prepare("INSERT INTO students (name, father_name, mother_name, dob, gender, blood_group, email, phone, address, permanent_address, school, exam_name, roll, reg, board, gpa, guardian_phone, guardian_job, photo, signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$stmt->bind_param("ssssssssssssssssssss", $name, $father_name, $mother_name, $dob, $gender, $blood_group, $email, $phone, $address, $permanent_address, $school, $exam_name, $roll, $reg, $board, $gpa, $guardian_phone, $guardian_job, $photo_path, $signature_path);

// এক্সিকিউট করা
if ($stmt->execute()) {
    echo "✅ আবেদন সফলভাবে জমা হয়েছে!";
} else {
    echo "❌ আবেদন জমা হয়নি: " . $stmt->error;
}

// কানেকশন বন্ধ করা
$stmt->close();
$conn->close();
?>
