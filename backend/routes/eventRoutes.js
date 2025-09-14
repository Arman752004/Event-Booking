
const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

router.post("/", authMiddleware, requireRole("organizer"), async (req, res) => {
  try {
    const { title, description, date, location, image, capacity } = req.body;

    if (!title || !description || !date || !location) {
      return res.status(400).json({ message: "❌ All required fields must be provided" });
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate) || eventDate < new Date()) {
      return res.status(400).json({ message: "❌ Event date must be today or in the future" });
    }

    if (capacity && capacity < 1) {
      return res.status(400).json({ message: "❌ Capacity must be at least 1" });
    }

    let event = await Event.create({
      title,
      description,
      date: eventDate,
      location,
      image: image || "/images/default-event.jpg",
      capacity: capacity || 100,
      bookingsCount: 0, 
      organizer: req.user.id, 
    });

    event = await event.populate("organizer", "name email");

    res.status(201).json({ message: "✅ Event created successfully", event });
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .populate("organizer", "name email")
      .sort({ date: 1 });

    res.json(events);
  } catch (err) {
    console.error("Fetch Events Error:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name email");

    if (!event || !event.isActive) {
      return res.status(404).json({ message: "❌ Event not found" });
    }

    res.json(event);
  } catch (err) {
    console.error("Get Event Error:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

router.put("/:id", authMiddleware, requireRole("organizer"), async (req, res) => {
  try {
    let event = await Event.findOne({ _id: req.params.id, organizer: req.user.id });

    if (!event) {
      return res.status(404).json({ message: "❌ Event not found or not authorized" });
    }

    if (event.date < new Date()) {
      return res.status(400).json({ message: "⚠️ Cannot update an event that has already passed" });
    }

    const { title, description, date, location, image, capacity } = req.body;

    if (capacity && capacity < event.bookingsCount) {
      return res.status(400).json({
        message: `❌ Capacity cannot be less than current confirmed bookings (${event.bookingsCount}).`,
      });
    }

    if (title) event.title = title;
    if (description) event.description = description;
    if (date) {
      const eventDate = new Date(date);
      if (isNaN(eventDate) || eventDate < new Date()) {
        return res.status(400).json({ message: "❌ Event date must be today or in the future" });
      }
      event.date = eventDate;
    }
    if (location) event.location = location;
    if (image) event.image = image;
    if (capacity) event.capacity = capacity;

    await event.save();
    event = await event.populate("organizer", "name email");

    res.json({ message: "✅ Event updated successfully", event });
  } catch (err) {
    console.error("Update Event Error:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

router.delete("/:id", authMiddleware, requireRole("organizer"), async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id });

    if (!event) {
      return res.status(404).json({ message: "❌ Event not found or not authorized" });
    }

    event.isActive = false;
    await event.save();

    res.json({ message: "❌ Event deactivated (soft deleted)", event });
  } catch (err) {
    console.error("Delete Event Error:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

module.exports = router;
