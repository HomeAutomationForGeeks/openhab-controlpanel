<?php

ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(-1);

$servername = "localhost";
$username = "openhab";	// TODO: change to your username
$password = "openhab";	// TODO: change your password

// Create connection
$conn = new mysqli($servername, $username, $password);

// Check connection
if ($conn->connect_error) {
	die("Connection failed: " . $conn->connect_error);
} 

class LogEntry
{
	public $timestamp;
	public $value;
}

$response = array();

if (isset($_GET["item"]))
{
	$itemname = $conn->real_escape_string($_GET["item"]);

	$sql = "SELECT ItemId FROM openhab.Items WHERE ItemName='$itemname' limit 1;";
	$result = $conn->query($sql);
	$itemid = $result->fetch_assoc()["ItemId"];

	$sql = "SELECT Time, Value FROM openhab.Item".$itemid." ORDER BY Time DESC LIMIT 6;";
	$result = $conn->query($sql);

	if ($result->num_rows > 0) {
		// output data of each row
		while($row = $result->fetch_assoc()) {
			$entry = new LogEntry();
			// some DateTime parsing to drop the "seconds" part (space is precious on our widgets)
			$new_date = DateTime::createFromFormat('Y-m-d H:i:s', $row["Time"]);
			$entry->timestamp = $new_date->format('Y-m-d H:i');
			$entry->value = $row["Value"];
			$response[] = $entry;
		}
	}
}

header('Content-Type: application/json');
echo json_encode($response, JSON_PRETTY_PRINT);

$conn->close();
?>