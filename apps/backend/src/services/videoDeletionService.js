import { cleanupOutputVideo } from './storageService.js';
import { writeAuditLog } from './auditService.js';

const activeStatuses = ['queued', 'processing', 'post_processing', 'uploading'];

export function canDeleteVideo(project) {
  return !activeStatuses.includes(project.status);
}

export async function softDeleteVideo({ project, actor, actorRole, action, reason = '', req }) {
  const previousStatus = project.status;

  project.isDeleted = true;
  project.deletedAt = new Date();
  project.deletedBy = actor._id;
  project.deletedByRole = actorRole;
  project.deletionReason = reason;
  await project.save();

  const cleanup = await cleanupOutputVideo({
    filePath: project.outputVideo?.path,
    publicId: project.outputVideo?.publicId
  });

  await writeAuditLog({
    actor: actor._id,
    action,
    resourceType: 'VideoProject',
    resourceId: project._id.toString(),
    req,
    metadata: {
      actorRole,
      targetUserId: project.user?.toString(),
      reason,
      previousStatus,
      provider: project.provider,
      model: project.model,
      creditCost: project.costCredits,
      cleanup
    }
  });

  return { cleanup, previousStatus };
}
