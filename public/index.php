<?php
// This file serves as a fallback for shared hosting environments
// that default to PHP instead of Node.js

// Redirect to the Node.js application
header('Location: /server.js');
exit;
?>