const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// CORS Issue Fix: Allow all origins and methods
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Server Warm-up Route (Render Sleep Mode Fix)
app.get('/', (req, res) => {
  res.send('SHIBA Backend is active and running!');
});

// 1. MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "YOUR_MONGO_URL_HERE";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully for SHIBA App"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// 2. Withdrawal Schema
const withdrawalSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  binanceId: { type: String, required: true },
  amount: { type: Number, required: true },
  app: { type: String, default: 'SHIBA' },
  tokenType: { type: String, default: 'SHIBA' },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

// 3. API: Submit Withdrawal Request
app.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, binanceId, amount } = req.body;

    if (!userId || !binanceId || !amount) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newRequest = new Withdrawal({
      userId,
      binanceId,
      amount,
      app: 'SHIBA',
      tokenType: 'SHIBA',
      status: 'Pending'
    });

    await newRequest.save();
    res.json({ success: true, message: "Withdrawal request saved!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. API: Admin Data Fetching
app.get('/api/withdrawals', async (req, res) => {
  try {
    const shibaRequests = await Withdrawal.find({ 
      $or: [{ app: 'SHIBA' }, { tokenType: 'SHIBA' }] 
    }).sort({ createdAt: -1 });

    res.json(shibaRequests);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. API: Status Update
app.put('/api/withdrawals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await Withdrawal.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!updated) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.json({ success: true, updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
