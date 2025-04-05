const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ status: 'OK', message: 'BTP-kun backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
