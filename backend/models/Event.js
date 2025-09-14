const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
    },
    description: {
      type: String,
      required: true,
      minlength: [10, "Description must be at least 10 characters long"],
    },
    date: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return value >= today;
        },
        message: "Event date must be today or in the future",
      },
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "/images/default-event.jpg",
    },
    capacity: {
      type: Number,
      default: 100,
      min: [1, "Capacity must be at least 1"],
    },
    bookingsCount: {
      type: Number,
      default: 0,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled"],
      default: "upcoming",
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

eventSchema.index({ date: 1 });
eventSchema.index({ title: "text", location: "text" });

eventSchema.pre("save", function (next) {
  const now = new Date();
  if (this.date < now && this.status === "upcoming") {
    this.status = "completed";
  }
  next();
});

eventSchema.methods.hasCapacity = function () {
  return this.bookingsCount < this.capacity;
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
