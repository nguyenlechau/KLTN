/**
 * ItemStatusService.ts
 * Handles item status management, propagation, and "Treo" state
 * Per SYSTEM_SPECIFICATION Section I (R4.7), Section F (workflow)
 */

export interface ItemStatusTransition {
  itemId: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
}

export class ItemStatusService {
  constructor(private db: any) {}

  /**
   * Item statuses:
   * - ACTIVE: Item is deployed/visible
   * - INACTIVE: Item not in use
   * - TREO: Temporarily suspended (in-progress during Brand Intake)
   */

  /**
   * R4.7: Parent status propagation
   * If category is INACTIVE OR position is INACTIVE -> item becomes INACTIVE
   */
  async propagateParentStatusChange(
    entityType: 'category' | 'location',
    entityId: string,
    newStatus: string
  ): Promise<ItemStatusTransition[]> {
    const transitions: ItemStatusTransition[] = [];

    try {
      if (newStatus !== 'INACTIVE') {
        // Only propagate deactivations
        return transitions;
      }

      if (entityType === 'category') {
        // Find all items under this category
        const items = await this.db.query(
          'SELECT id FROM physical_items WHERE category_id = $1 AND deleted_at IS NULL',
          [entityId]
        );

        for (const item of items.rows) {
          const updated = await this.db.query(
            'UPDATE physical_items SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING status',
            ['INACTIVE', item.id]
          );

          transitions.push({
            itemId: item.id,
            oldStatus: 'ACTIVE',
            newStatus: 'INACTIVE',
            reason: `Parent category deactivated`,
          });
        }
      } else if (entityType === 'location') {
        // Find all items under this location
        const items = await this.db.query(
          'SELECT id FROM physical_items WHERE location_id = $1 AND deleted_at IS NULL',
          [entityId]
        );

        for (const item of items.rows) {
          await this.db.query(
            'UPDATE physical_items SET status = $1, updated_at = NOW() WHERE id = $2',
            ['INACTIVE', item.id]
          );

          transitions.push({
            itemId: item.id,
            oldStatus: 'ACTIVE',
            newStatus: 'INACTIVE',
            reason: `Parent location deactivated`,
          });
        }
      }
    } catch (error) {
      throw new Error(`Status propagation failed: ${error.message}`);
    }

    return transitions;
  }

  /**
   * Mark items as TREO (suspended) during Brand Intake phase
   * Used when BRAND adds new items to registration
   */
  async markItemsAsInProgress(itemIds: string[]): Promise<void> {
    try {
      for (const itemId of itemIds) {
        await this.db.query(
          'UPDATE physical_items SET status = $1, updated_at = NOW() WHERE id = $2',
          ['TREO', itemId]
        );
      }
    } catch (error) {
      throw new Error(`Failed to mark items as in-progress: ${error.message}`);
    }
  }

  /**
   * Revert items from TREO back to ACTIVE (when removed from Brand Intake)
   */
  async revertItemsFromInProgress(itemIds: string[]): Promise<void> {
    try {
      for (const itemId of itemIds) {
        // Check parent status before reverting
        const item = await this.db.query(
          `SELECT c.status as category_status, l.status as location_status
           FROM physical_items pi
           JOIN categories c ON pi.category_id = c.id
           JOIN locations l ON pi.location_id = l.id
           WHERE pi.id = $1`,
          [itemId]
        );

        if (item.rows.length > 0) {
          const { category_status, location_status } = item.rows[0];

          // Revert to ACTIVE only if parents are also ACTIVE
          const newStatus =
            category_status === 'ACTIVE' && location_status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';

          await this.db.query(
            'UPDATE physical_items SET status = $1, updated_at = NOW() WHERE id = $2',
            [newStatus, itemId]
          );
        }
      }
    } catch (error) {
      throw new Error(`Failed to revert items from in-progress: ${error.message}`);
    }
  }

  /**
   * Validate that item can be edited (not in TREO state)
   */
  async isItemEditable(itemId: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        'SELECT status FROM physical_items WHERE id = $1',
        [itemId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      // Item is editable if not TREO
      return result.rows[0].status !== 'TREO';
    } catch (error) {
      throw new Error(`Failed to check item editability: ${error.message}`);
    }
  }

  /**
   * Get count of items in each status for a registration
   */
  async getRegistrationItemStatusCounts(registrationId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    inProgress: number;
  }> {
    try {
      const result = await this.db.query(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN pi.status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN pi.status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN pi.status = 'TREO' THEN 1 ELSE 0 END) as in_progress
        FROM ad_registration_items ri
        JOIN physical_items pi ON ri.physical_item_id = pi.id
        WHERE ri.registration_id = $1`,
        [registrationId]
      );

      return {
        total: parseInt(result.rows[0].total || 0),
        active: parseInt(result.rows[0].active || 0),
        inactive: parseInt(result.rows[0].inactive || 0),
        inProgress: parseInt(result.rows[0].in_progress || 0),
      };
    } catch (error) {
      throw new Error(`Failed to get registration item counts: ${error.message}`);
    }
  }

  /**
   * Check if any items in a registration are TREO (in-progress)
   * Used to validate operations that shouldn't happen during Brand Intake
   */
  async hasInProgressItems(registrationId: string): Promise<boolean> {
    try {
      const result = await this.db.query(
        `SELECT COUNT(*) as count
         FROM ad_registration_items ri
         JOIN physical_items pi ON ri.physical_item_id = pi.id
         WHERE ri.registration_id = $1 AND pi.status = 'TREO'`,
        [registrationId]
      );

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new Error(`Failed to check for in-progress items: ${error.message}`);
    }
  }

  /**
   * Get all items in TREO status (in-progress)
   */
  async getInProgressItems(registrationId: string): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT pi.id, pi.item_code, pi.item_name, pi.status
         FROM ad_registration_items ri
         JOIN physical_items pi ON ri.physical_item_id = pi.id
         WHERE ri.registration_id = $1 AND pi.status = 'TREO'
         ORDER BY pi.item_code`,
        [registrationId]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get in-progress items: ${error.message}`);
    }
  }
}

export default ItemStatusService;
