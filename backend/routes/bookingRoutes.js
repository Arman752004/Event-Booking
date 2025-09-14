
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");


router.post("/", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: "❌ Event ID is required" });
    }

    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return res.status(404).json({ message: "❌ Event not found or inactive" });
    }
    if (event.date < new Date()) {
      return res.status(400).json({ message: "⚠️ Cannot book an event that has already passed" });
    }

    let existing = await Booking.findOne({ user: req.user.id, event: eventId });
    if (existing && existing.status !== "cancelled") {
      return res.status(400).json({ message: "⚠️ You already have a booking for this event." });
    }

    if (event.bookingsCount >= event.capacity) {
      return res.status(400).json({ message: "⚠️ Event is fully booked." });
    }

    if (existing) {
      existing.status = "confirmed";
      await existing.save();

      event.bookingsCount += 1;
      await event.save();

      return res.status(200).json({
        message: "✅ Booking re-confirmed",
        booking: existing,
      });
    }

    const booking = await Booking.create({
      user: req.user.id,
      event: eventId,
      status: "confirmed", 
    });

    event.bookingsCount += 1;
    await event.save();

    res.status(201).json({
      message: "✅ Booking confirmed successfully",
      booking,
    });
  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("event", "title date location capacity organizer isActive bookingsCount")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("Fetch My Bookings Error:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate("event");

    if (!booking) {
      return res.status(404).json({ message: "❌ Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "⚠️ Booking already cancelled." });
    }

    booking.status = "cancelled";
    await booking.save();

    if (booking.event && booking.event.bookingsCount > 0) {
      booking.event.bookingsCount -= 1;
      await booking.event.save();
    }

    res.json({ message: "✅ Booking cancelled successfully", booking });
  } catch (err) {
    console.error("Cancel Booking Error:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});


router.get("/organizer", authMiddleware, requireRole("organizer"), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: "event",
        match: { organizer: req.user.id },
        select: "title date location capacity organizer bookingsCount",
      })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const filtered = bookings.filter(b => b.event);
    res.json(filtered);
  } catch (err) {
    console.error("Organizer Fetch Bookings Error:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

router.get("/event/:eventId", authMiddleware, requireRole("organizer"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "❌ Event not found" });

    if (String(event.organizer) !== String(req.user.id)) {
      return res.status(403).json({ message: "🚫 Not authorized to view bookings for this event" });
    }

    const bookings = await Booking.find({ event: req.params.eventId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("Fetch Event Bookings Error:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

module.exports = router;
