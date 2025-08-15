// Audit log related TypeScript interfaces

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  target_type: string
  target_id: string
  before_state: any
  after_state: any
  timestamp: string
  reason: string | null
}

export enum AuditAction {
  // Product actions
  CREATE_PRODUCT = 'create_product',
  UPDATE_PRODUCT = 'update_product',
  DELETE_PRODUCT = 'delete_product',
  
  // Waitlist actions
  APPROVE_NEW = 'approve_new',
  APPROVE_UPDATE = 'approve_update',
  REJECT_NEW = 'reject_new',
  REJECT_UPDATE = 'reject_update',
  
  // Bulk actions
  BULK_APPROVE = 'bulk_approve',
  BULK_REJECT = 'bulk_reject',
  BULK_APPROVE_SUMMARY = 'bulk_approve_summary',
  BULK_REJECT_SUMMARY = 'bulk_reject_summary',
  
  // Status changes
  STATUS_CHANGE = 'status_change',
  MANUAL_EDIT = 'manual_edit'
}

export enum AuditTargetType {
  PRODUCT = 'product',
  WAITLIST_UPDATE = 'waitlist_update',
  WAITLIST_BULK_OPERATION = 'waitlist_bulk_operation'
}

export enum AuditActionCategory {
  APPROVAL = 'approval',
  REJECTION = 'rejection',
  CREATION = 'creation',
  MODIFICATION = 'modification',
  DELETION = 'deletion',
  BULK_OPERATION = 'bulk_operation',
  OTHER = 'other'
}

export interface AuditLogEntryDetailed extends AuditLogEntry {
  timestamp_formatted: string
  action_category: AuditActionCategory
  target_summary: string
  state_diff: AuditStateDiff | null
  related_entries: {
    same_target: Array<{
      id: string
      action: string
      timestamp: string
      actor: string
    }>
    same_actor_timeframe: Array<{
      id: string
      action: string
      timestamp: string
      target_type: string
      target_id: string
    }>
  }
  metadata: {
    has_before_state: boolean
    has_after_state: boolean
    has_reason: boolean
    state_change_count: number
  }
}

export interface AuditStateDiff {
  [key: string]: {
    before: any
    after: any
    type: 'added' | 'removed' | 'type_changed' | 'value_changed' | 'text_changed' | 'boolean_changed' | 'modified'
    percentage_change?: number
  }
}

export interface AuditLogFilter {
  actor?: string
  action?: string
  target_type?: string
  target_id?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface AuditApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}