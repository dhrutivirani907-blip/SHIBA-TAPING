const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://dhrutivirani907:YOUR_PASSWORD@cluster0.mongodb.net/shiba_app?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 2. Schema & Model Definition
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

// 3. API Routes

// Health Check
app.get('/', (req, res) => {
  res.send('SHIBA Tap App Backend Server Running Perfectly!');
});

// Submit Withdrawal Request
app.post('/api/withdraw', async (req, res) => {
  try {
    const { userId, binanceId, amount, wallet, tokenType, app: appName } = req.body;
    const finalBinanceId = binanceId || wallet;

    if (!userId || !finalBinanceId || !amount) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newRequest = new Withdrawal({
      userId: userId,
      binanceId: finalBinanceId,
      amount: Number(amount),
      app: appName || 'SHIBA',
      tokenType: tokenType || 'SHIBA',
      status: 'Pending'
    });

    await newRequest.save();
    console.log("✅ New Withdrawal Saved:", newRequest);

    res.json({ success: true, message: "Withdrawal request submitted successfully!" });
  } catch (error) {
    console.error("❌ Database Save Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch All Withdrawal Requests for Admin
app.get('/api/withdrawals', async (req, res) => {
  try {
    const requests = await Withdrawal.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error("❌ Fetch Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Status Route (PUT /api/withdrawals/:id)
app.put('/api/withdrawals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ success: false, message: "ID and Status are required" });
    }

    const updated = await Withdrawal.findByIdAndUpdate(id, { status: status }, { new: true });
    
    if (!updated) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    console.log(`✅ Status Updated for ID ${id}: ${status}`);
    res.json({ success: true, message: `Status updated to ${status}`, data: updated });
  } catch (error) {
    console.error("❌ Status Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Backward Compatible Route (POST /api/admin/update-status)
app.post('/api/admin/update-status', async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, message: "ID and Status required" });
    }

    await Withdrawal.findByIdAndUpdate(id, { status: status });
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
