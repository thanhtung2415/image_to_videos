import { CostEvent } from '../models/CostEvent.js';

export async function recordCostEvent({ user, project, job, provider, model, eventType, credits, providerCost = 0, metadata }) {
  return CostEvent.create({
    user,
    project,
    job,
    provider,
    model,
    eventType,
    credits,
    providerCost,
    metadata
  });
}

export async function getCostSummary() {
  const [byProvider, totals] = await Promise.all([
    CostEvent.aggregate([
      {
        $group: {
          _id: '$provider',
          events: { $sum: 1 },
          credits: { $sum: '$credits' },
          providerCost: { $sum: '$providerCost' }
        }
      },
      { $sort: { credits: -1 } }
    ]),
    CostEvent.aggregate([
      {
        $group: {
          _id: null,
          events: { $sum: 1 },
          credits: { $sum: '$credits' },
          providerCost: { $sum: '$providerCost' }
        }
      }
    ])
  ]);

  return {
    totals: totals[0] || { events: 0, credits: 0, providerCost: 0 },
    byProvider
  };
}

