import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    creditWallet: {
      availableCredit: {
        type: Number,
        default: 20
      },
      reservedCredit: {
        type: Number,
        default: 0
      },
      lifetimePurchased: {
        type: Number,
        default: 20
      },
      lifetimeUsed: {
        type: Number,
        default: 0
      }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);

