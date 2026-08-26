import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  { collection: 'settings', timestamps: true }
);

export const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
