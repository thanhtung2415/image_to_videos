import { AuditLog } from '../models/AuditLog.js';

export async function writeAuditLog({ actor, action, resourceType, resourceId, req, metadata }) {
  return AuditLog.create({
    actor,
    action,
    resourceType,
    resourceId,
    ipAddress: req?.ip || '',
    userAgent: req?.headers?.['user-agent'] || '',
    metadata
  });
}

