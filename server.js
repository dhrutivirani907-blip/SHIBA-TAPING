const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. MongoDB Connection (Apna MongoDB URL yahan dalein)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://YOUR_MONGO_URL_HERE";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully for SHIBA App"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// 2. Withdrawal Schema (App Tagning ke saath)
const withdrawalSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  binanceId: { type: String, required: true },
  amount: { type: Number, required: true },
  app: { type: String, default: 'SHIBA' }, // Multi-app Filter Tag
  tokenType: { type: String, default: 'SHIBA' },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

// 3. API: User Withdrawal Request Receive Karna
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

// 4. API: Filtered Admin Data (Sirf SHIBA Apps ki requests bhejna)
app.get('/api/withdrawals', async (req, res) => {
  try {
    // Strictly filtering requests where app or tokenType is SHIBA
    const shibaRequests = await Withdrawal.find({ 
      $or: [{ app: 'SHIBA' }, { tokenType: 'SHIBA' }] 
    }).sort({ createdAt: -1 });

    res.json(shibaRequests);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. API: Status Update (Approve / Reject)
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

// Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
