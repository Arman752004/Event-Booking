const Contact = require("../models/Contact");

exports.sendMessage = async (req, res) => {
  try {
    const name = req.user ? req.user.name : req.body.name;
    const email = req.user ? req.user.email : req.body.email;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message field is required" });
    }

    const newMessage = await Contact.create({ name, email, message });

    res.status(201).json({
      message: "✅ Message sent successfully!",
      data: newMessage,
    });
  } catch (err) {
    console.error("❌ Contact Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error("❌ Fetch Messages Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
