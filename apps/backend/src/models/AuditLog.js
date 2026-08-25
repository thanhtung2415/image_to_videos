import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    resourceType: {
      type: String,
      default: ''
    },
    resourceId: {
      type: String,
      default: '',
      index: true
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

