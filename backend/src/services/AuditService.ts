/**
 * AuditService.ts
 * Implements immutable append-only audit trail logging per SYSTEM_SPECIFICATION Section J
 */

export interface AuditRecord {
  id?: string;
  user_id: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSITION' | 'APPROVE' | 'REJECT' | 'REVISE' | 'ATTACHMENT';
  entity_type: string;
  entity_id: string;
  entity_code?: string;
  old_value?: string;
  new_value?: string;
  field_name?: string;
  notes?: string;
  timestamp?: Date;
  ip_address?: string;
}

export class AuditService {
  constructor(private db: any) {}

  /**
   * Log an audit event (CREATE, UPDATE, DELETE, TRANSITION, etc.)
   * All audit records are immutable and append-only
   */
  async logAudit(record: AuditRecord): Promise<string> {
    try {
      const result = await this.db.query(`
        INSERT INTO audit_trail (
          user_id,
          action_type,
          entity_type,
          entity_id,
          entity_code,
          old_value,
          new_value,
          field_name,
          notes,
          timestamp,
          ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
        RETURNING id
      `, [
        record.user_id,
        record.action_type,
        record.entity_type,
        record.entity_id,
        record.entity_code || null,
        record.old_value || null,
        record.new_value || null,
        record.field_name || null,
        record.notes || null,
        record.ip_address || null,
      ]);

      return result.rows[0].id;
    } catch (error) {
      throw new Error(`Audit logging failed: ${error.message}`);
    }
  }

  /**
   * Log entity creation
   */
  async logCreate(
    userId: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    newValue: any,
    notes?: string
  ): Promise<void> {
    await this.logAudit({
      user_id: userId,
      action_type: 'CREATE',
      entity_type: entityType,
      entity_id: entityId,
      entity_code: entityCode,
      new_value: JSON.stringify(newValue),
      notes: notes || `${entityType} created`,
    });
  }

  /**
   * Log entity update (field change)
   */
  async logUpdate(
    userId: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    fieldName: string,
    oldValue: any,
    newValue: any,
    notes?: string
  ): Promise<void> {
    await this.logAudit({
      user_id: userId,
      action_type: 'UPDATE',
      entity_type: entityType,
      entity_id: entityId,
      entity_code: entityCode,
      field_name: fieldName,
      old_value: JSON.stringify(oldValue),
      new_value: JSON.stringify(newValue),
      notes: notes || `${fieldName} updated`,
    });
  }

  /**
   * Log entity deletion (soft delete)
   */
  async logDelete(
    userId: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    notes?: string
  ): Promise<void> {
    await this.logAudit({
      user_id: userId,
      action_type: 'DELETE',
      entity_type: entityType,
      entity_id: entityId,
      entity_code: entityCode,
      notes: notes || `${entityType} soft-deleted`,
    });
  }

  /**
   * Log workflow state transition
   */
  async logTransition(
    userId: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    fromStatus: string,
    toStatus: string,
    notes?: string
  ): Promise<void> {
    await this.logAudit({
      user_id: userId,
      action_type: 'TRANSITION',
      entity_type: entityType,
      entity_id: entityId,
      entity_code: entityCode,
      field_name: 'status',
      old_value: fromStatus,
      new_value: toStatus,
      notes: notes || `${entityType} transitioned from ${fromStatus} to ${toStatus}`,
    });
  }

  /**
   * Log approval decision
   */
  async logApproval(
    userId: string,
    entityType: string,
    entityId: string,
    entityCode: string,
    fromStatus: string,
    toStatus: string,
    approved: boolean,
    notes?: string
  ): Promise<void> {
    await this.logAudit({
      user_id: userId,
      action_type: approved ? 'APPROVE' : 'REJECT',
      entity_type: entityType,
      entity_id: entityId,
      entity_code: entityCode,
      field_name: 'status',
      old_value: fromStatus,
      new_value: toStatus,
      notes: notes || (approved ? 'Approved' : 'Rejected'),
    });
  }

  /**
   * Get audit history for an entity (immutable read-only)
   */
  async getHistory(
    entityType: string,
    entityId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT 
          a.id,
          a.user_id,
          u.full_name as user_name,
          a.action_type,
          a.entity_type,
          a.entity_id,
          a.entity_code,
          a.field_name,
          a.old_value,
          a.new_value,
          a.notes,
          a.timestamp,
          a.ip_address
        FROM audit_trail a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.entity_type = $1 AND a.entity_id = $2
        ORDER BY a.timestamp DESC
        LIMIT $3 OFFSET $4
      `, [entityType, entityId, limit, offset]);

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to retrieve audit history: ${error.message}`);
    }
  }

  /**
   * Get all audit records for a user (access history)
   */
  async getUserHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT *
        FROM audit_trail
        WHERE user_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to retrieve user history: ${error.message}`);
    }
  }

  /**
   * Get audit records by date range
   */
  async getAuditByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 1000,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT 
          a.id,
          a.user_id,
          u.full_name as user_name,
          a.action_type,
          a.entity_type,
          a.entity_id,
          a.entity_code,
          a.timestamp,
          a.notes
        FROM audit_trail a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.timestamp >= $1 AND a.timestamp <= $2
        ORDER BY a.timestamp DESC
        LIMIT $3 OFFSET $4
      `, [startDate, endDate, limit, offset]);

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to retrieve audit records by date: ${error.message}`);
    }
  }

  /**
   * Get audit records by action type
   */
  async getAuditByActionType(
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSITION' | 'APPROVE' | 'REJECT',
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const result = await this.db.query(`
        SELECT 
          a.id,
          a.user_id,
          u.full_name as user_name,
          a.action_type,
          a.entity_type,
          a.entity_id,
          a.entity_code,
          a.timestamp
        FROM audit_trail a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.action_type = $1
        ORDER BY a.timestamp DESC
        LIMIT $2 OFFSET $3
      `, [actionType, limit, offset]);

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to retrieve audit by action type: ${error.message}`);
    }
  }

  /**
   * Verify immutability (audit trail cannot be updated or deleted)
   * This method enforces the immutable append-only contract
   */
  async verifyImmutability(): Promise<boolean> {
    try {
      // Query to ensure NO DELETE or UPDATE operations are possible on audit_trail
      // This should be enforced at DB level with triggers, but we verify here
      const result = await this.db.query(`
        SELECT COUNT(*) as count
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND event_object_table = 'audit_trail'
        AND (action_statement ILIKE '%BEFORE DELETE%' OR action_statement ILIKE '%BEFORE UPDATE%')
      `);

      return parseInt(result.rows[0].count) >= 2; // At least 2 protection triggers
    } catch (error) {
      console.warn('Could not verify audit immutability triggers:', error.message);
      return false; // Conservative: warn if verification fails
    }
  }
}

export default AuditService;
