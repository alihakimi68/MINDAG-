const express = require('express');
const app = express();
const path = require('path');
const proxy = require('express-http-proxy'); // Import the proxy middleware

const port = 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));

// Serve your HTML file when accessing the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create a proxy route to forward requests to the external API
app.use('/proxy', proxy('https://events-api.cruncho.co'));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
