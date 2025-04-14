const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

// 启用 CORS
app.use(cors());

// 代理路由
app.get('/api/account/tokens', async (req, res) => {
  try {
    const response = await axios.get(`https://apilist.tronscanapi.com/api/account/tokens${req.url.split('?')[1]}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/api/filter/trc20/transfers', async (req, res) => {
  try {
    const response = await axios.get(`https://apilist.tronscanapi.com/api/filter/trc20/transfers${req.url.split('?')[1]}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/api/account', async (req, res) => {
  try {
    const response = await axios.get(`https://apilist.tronscanapi.com/api/account${req.url.split('?')[1]}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/api/account/resourcev2', async (req, res) => {
  try {
    const response = await axios.get(`https://apilist.tronscanapi.com/api/account/resourcev2${req.url.split('?')[1]}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
}); 