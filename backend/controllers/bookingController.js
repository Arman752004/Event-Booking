const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");
const bookingController = require("../controllers/bookingController");

router.post("/", authMiddleware, bookingController.createBooking);

router.get("/my", authMiddleware, bookingController.getMyBookings);

router.put("/:id/cancel", authMiddleware, bookingController.cancelBooking);


router.get(
  "/organizer",
  authMiddleware,
  requireRole("organizer"),
  bookingController.getOrganizerBookings
);

router.get(
  "/event/:eventId",
  authMiddleware,
  requireRole("organizer"),
  bookingController.getEventBookings
);

router.put(
  "/:id/accept",
  authMiddleware,
  requireRole("organizer"),
  bookingController.acceptBooking
);

router.put(
  "/:id/reject",
  authMiddleware,
  requireRole("organizer"),
  bookingController.rejectBooking
);

module.exports = router;
