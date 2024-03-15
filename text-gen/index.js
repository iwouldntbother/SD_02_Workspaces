const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.use('/models', express.static(path.join(__dirname, 'models')));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
