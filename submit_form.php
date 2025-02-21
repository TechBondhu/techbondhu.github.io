<?php
$servername = "sql305.infinityfree.com"; // তোমার Database Hostname
$username = "if0_38363783"; // তোমার Database Username
$password = "84F30XeGbvr8"; // তোমার Database Password
$database = "if0_38363783_student_info"; // তোমার Database Name

// ডাটাবেজ কানেকশন
$conn = new mysqli($servername, $username, $password, $database);

// কানেকশন চেক
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// ফর্ম থেকে ডাটা নেওয়া
$name = $_POST['name'];
$father_name = $_POST['father_name'];
$mother_name = $_POST['mother_name'];
$dob = $_POST['dob'];
$gender = $_POST['gender'];
$blood_group = $_POST['blood_group'];
$email = $_POST['email'];
$phone = $_POST['phone'];
$address = $_POST['address'];
$permanent_address = $_POST['permanent_address'];
$school = $_POST['school'];
$exam_name = $_POST['exam_name'];
$roll = $_POST['roll'];
$reg = $_POST['reg'];
$board = $_POST['board'];
$gpa = $_POST['gpa'];
$guardian_phone = $_POST['guardian_phone'];
$guardian_job = $_POST['guardian_job'];

// SQL Query
$sql = "INSERT INTO students (name, father_name, mother_name, dob, gender, blood_group, email, phone, address, permanent_address, school, exam_name, roll, reg, board, gpa, guardian_phone, guardian_job) 
        VALUES ('$name', '$father_name', '$mother_name', '$dob', '$gender', '$blood_group', '$email', '$phone', '$address', '$permanent_address', '$school', '$exam_name', '$roll', '$reg', '$board', '$gpa', '$guardian_phone', '$guardian_job')";

// এক্সিকিউট করা
if ($conn->query($sql) === TRUE) {
    echo "✅ আবেদন সফলভাবে জমা হয়েছে!";
} else {
    echo "❌ আবেদন জমা হয়নি: " . $conn->error;
}

// কানেকশন বন্ধ করা
$conn->close();
?>
