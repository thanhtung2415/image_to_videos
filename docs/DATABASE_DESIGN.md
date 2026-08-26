# Database Design

The project uses MongoDB with Mongoose models.

| Model | Collection | Purpose |
| --- | --- | --- |
| User | users | Account, role, status, profile and embedded credit wallet. |
| VideoProject | video_projects | Uploaded image, prompt, generation mode, provider/model, status and output video. |
| GenerationJob | generation_jobs | Background job state, queue id, progress, provider request id and error tracking. |
| CreditWallet | users.creditWallet | Available/reserved credit totals and lifetime purchased/used counters. |
| CreditTransaction | credit_transactions | Purchase, reserve, capture, release, refund, manual adjustment and promotion bonus history. |
| CreditPackage | pricing_plans | Credit packages shown to users and managed by admin. |
| Payment | payments | Mock payment records for buying credit packages. |
| Promotion | promotions | Campaign name/code, period, bonus credit, registration limit, conditions and status. |
| PromotionRegistration | promotion_registrations | Which user claimed which promotion and how much credit was granted. |
| Settings | settings | Video cost, upload limit and provider settings. |
| Notification | notifications | In-app notifications for user events. |
| AuditLog | audit_logs | Important user/admin actions. |
| ContentReport | content_reports | User reports for generated videos. |
| Refund | refunds | Mock refund records. |
| ProviderHealth | provider_health | AI provider readiness and health status. |
| CostEvent | cost_events | Provider and credit cost tracking. |

Credit changes are written by backend services only. User requests cannot directly mutate credit balances.
