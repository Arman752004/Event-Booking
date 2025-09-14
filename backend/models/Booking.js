const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event", 
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed", 
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

bookingSchema.index({ user: 1, event: 1 }, { unique: true });

bookingSchema.virtual("eventDetails", {
  ref: "Event",
  localField: "event",
  foreignField: "_id",
  justOne: true,
});

bookingSchema.pre("save", function (next) {
  if (!["confirmed", "cancelled"].includes(this.status)) {
    this.status = "confirmed";
  }
  next();
});

async function updateEventBookingsCount(eventId) {
  try {
    const Booking = mongoose.model("Booking");
    const Event = mongoose.model("Event");

    const confirmedCount = await Booking.countDocuments({
      event: eventId,
      status: "confirmed",
    });

    await Event.findByIdAndUpdate(eventId, { bookingsCount: confirmedCount });
  } catch (err) {
    console.error("❌ Error updating bookingsCount:", err.message);
  }
}

bookingSchema.post("save", function (doc) {
  updateEventBookingsCount(doc.event);
});

bookingSchema.post("remove", function (doc) {
  updateEventBookingsCount(doc.event);
});

bookingSchema.pre(/^find/, function (next) {
  this.populate("event", "title date location organizer status bookingsCount");
  this.populate("user", "name email");
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
