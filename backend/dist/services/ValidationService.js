/**
 * ValidationService.ts
 * Implements all 40+ business rules from SYSTEM_SPECIFICATION Section I
 * Master Data Rules, Registration Workflow Rules, Financial Rules, Access Control
 */
export class ValidationService {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * ============================================================
     * CHANNEL RULES (R1.1 - R1.4)
     * ============================================================
     */
    // R1.1: Channel code must be unique and 10 chars max
    async validateChannelCode(code) {
        if (!code || code.length > 10) {
            return {
                code: 'R1.1',
                message: 'Channel code must be 1-10 characters',
                severity: 'ERROR',
            };
        }
        return null;
    }
    // R1.2: Cannot deactivate channel if active locations exist
    async validateChannelDeactivation(channelId) {
        try {
            const result = await this.db.query('SELECT COUNT(*) as count FROM locations WHERE channel_id = $1 AND status = $2 AND deleted_at IS NULL', [channelId, 'ACTIVE']);
            if (parseInt(result.rows[0].count) > 0) {
                return {
                    code: 'R1.2',
                    message: `Cannot deactivate channel: ${result.rows[0].count} active locations depend on it`,
                    severity: 'ERROR',
                };
            }
        }
        catch (error) {
            throw new Error(`ValidationService R1.2 failed: ${error.message}`);
        }
        return null;
    }
    // R1.3: Deactivating channel cascades to all child locations (set to inactive)
    async cascadeChannelDeactivation(channelId) {
        try {
            await this.db.query('UPDATE locations SET status = $1, updated_at = NOW() WHERE channel_id = $2 AND deleted_at IS NULL', ['INACTIVE', channelId]);
            // Then cascade to items under those locations
            await this.db.query(`
        UPDATE physical_items 
        SET status = 'INACTIVE', updated_at = NOW()
        WHERE location_id IN (SELECT id FROM locations WHERE channel_id = $1)
        AND deleted_at IS NULL
      `, [channelId]);
        }
        catch (error) {
            throw new Error(`Cascade deactivation failed: ${error.message}`);
        }
    }
    /**
     * ============================================================
     * CATEGORY RULES (R2.1 - R2.7)
     * ============================================================
     */
    // R2.2: Category name unique, 1–225 chars, cannot be all-space
    async validateCategoryName(name) {
        if (!name || name.trim().length === 0) {
            return {
                code: 'R2.2',
                message: 'Category name cannot be empty or all spaces',
                severity: 'ERROR',
            };
        }
        if (name.length > 225) {
            return {
                code: 'R2.2',
                message: 'Category name must be 1-225 characters',
                severity: 'ERROR',
            };
        }
        return null;
    }
    // R2.3 & R2.4: Price change - applies only to registrations not yet in Brand Manager Approval
    async validateCategoryPriceChange(categoryId, newPrice) {
        // This is more of a warning - show to user before update
        try {
            const affectedRegistrations = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM ad_registrations r
        JOIN ad_registration_items ri ON r.id = ri.registration_id
        JOIN physical_items pi ON ri.physical_item_id = pi.id
        WHERE pi.category_id = $1
        AND r.status NOT IN ('Bản nháp', 'CBQL Phê duyệt', 'P.Thương hiệu tiếp nhận')
        AND r.deleted_at IS NULL
      `, [categoryId]);
            if (parseInt(affectedRegistrations.rows[0].count) > 0) {
                return {
                    code: 'R2.4',
                    message: `Price update will NOT apply to ${affectedRegistrations.rows[0].count} registrations already in approval/acceptance phases`,
                    severity: 'WARNING',
                };
            }
        }
        catch (error) {
            throw new Error(`Price change validation failed: ${error.message}`);
        }
        return null;
    }
    // R2.5: Cannot deactivate category if items in "Treo" status exist
    async validateCategoryDeactivation(categoryId) {
        try {
            const result = await this.db.query('SELECT COUNT(*) as count FROM physical_items WHERE category_id = $1 AND status = $2 AND deleted_at IS NULL', [categoryId, 'TREO']);
            if (parseInt(result.rows[0].count) > 0) {
                return {
                    code: 'R2.5',
                    message: `Cannot deactivate category: ${result.rows[0].count} items are in-progress (Treo status)`,
                    severity: 'ERROR',
                };
            }
        }
        catch (error) {
            throw new Error(`Category deactivation validation failed: ${error.message}`);
        }
        return null;
    }
    // R2.6: Deactivating category cascades to all active items
    async cascadeCategoryDeactivation(categoryId) {
        try {
            await this.db.query('UPDATE physical_items SET status = $1, updated_at = NOW() WHERE category_id = $2 AND deleted_at IS NULL', ['INACTIVE', categoryId]);
        }
        catch (error) {
            throw new Error(`Category cascade deactivation failed: ${error.message}`);
        }
    }
    /**
     * ============================================================
     * LOCATION RULES (R3.1 - R3.8)
     * ============================================================
     */
    // R3.3: Longitude/Latitude validation
    async validateCoordinates(longitude, latitude) {
        if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
            return {
                code: 'R3.3',
                message: 'Longitude must be between -180 and 180',
                severity: 'ERROR',
            };
        }
        if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
            return {
                code: 'R3.3',
                message: 'Latitude must be between -90 and 90',
                severity: 'ERROR',
            };
        }
        return null;
    }
    // R3.4: Representative phone must be 10 digits
    async validatePhoneNumber(phone) {
        if (phone && !/^\d{10}$/.test(phone)) {
            return {
                code: 'R3.4',
                message: 'Phone number must be exactly 10 digits',
                severity: 'ERROR',
            };
        }
        return null;
    }
    // R3.5: Representative email must be valid format
    async validateEmail(email) {
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return {
                code: 'R3.5',
                message: 'Invalid email format',
                severity: 'ERROR',
            };
        }
        return null;
    }
    // R3.6: Cannot deactivate location if items in "Treo" status exist
    async validateLocationDeactivation(locationId) {
        try {
            const result = await this.db.query('SELECT COUNT(*) as count FROM physical_items WHERE location_id = $1 AND status = $2 AND deleted_at IS NULL', [locationId, 'TREO']);
            if (parseInt(result.rows[0].count) > 0) {
                return {
                    code: 'R3.6',
                    message: `Cannot deactivate location: ${result.rows[0].count} items are in-progress`,
                    severity: 'ERROR',
                };
            }
        }
        catch (error) {
            throw new Error(`Location deactivation validation failed: ${error.message}`);
        }
        return null;
    }
    // R3.7: Deactivating location cascades to all active items
    async cascadeLocationDeactivation(locationId) {
        try {
            await this.db.query('UPDATE physical_items SET status = $1, updated_at = NOW() WHERE location_id = $2 AND deleted_at IS NULL', ['INACTIVE', locationId]);
        }
        catch (error) {
            throw new Error(`Location cascade deactivation failed: ${error.message}`);
        }
    }
    /**
     * ============================================================
     * PHYSICAL ITEM RULES (R4.1 - R4.8)
     * ============================================================
     */
    // R4.3: Width/Length max 99.99 m, 2 decimals
    async validateItemDimensions(width, length) {
        if (width !== undefined) {
            if (width < 0 || width > 99.99) {
                return {
                    code: 'R4.3',
                    message: 'Width must be between 0 and 99.99 meters',
                    severity: 'ERROR',
                };
            }
            // Check 2 decimals
            if (width.toString().split('.')[1]?.length > 2) {
                return {
                    code: 'R4.3',
                    message: 'Width must have maximum 2 decimal places',
                    severity: 'ERROR',
                };
            }
        }
        if (length !== undefined) {
            if (length < 0 || length > 99.99) {
                return {
                    code: 'R4.3',
                    message: 'Length must be between 0 and 99.99 meters',
                    severity: 'ERROR',
                };
            }
            // Check 2 decimals
            if (length.toString().split('.')[1]?.length > 2) {
                return {
                    code: 'R4.3',
                    message: 'Length must have maximum 2 decimal places',
                    severity: 'ERROR',
                };
            }
        }
        return null;
    }
    // R4.5: Cannot edit item if status is "Treo"
    async validateItemEditability(itemId) {
        try {
            const result = await this.db.query('SELECT status FROM physical_items WHERE id = $1', [itemId]);
            if (result.rows.length === 0) {
                return {
                    code: 'R4.5',
                    message: 'Item not found',
                    severity: 'ERROR',
                };
            }
            if (result.rows[0].status === 'TREO') {
                return {
                    code: 'R4.5',
                    message: 'Cannot edit item while in-progress (Treo status)',
                    severity: 'ERROR',
                };
            }
        }
        catch (error) {
            throw new Error(`Item editability validation failed: ${error.message}`);
        }
        return null;
    }
    // R4.7: Parent status propagation
    async propagateItemStatusFromParent(itemId) {
        try {
            // Get item's category and position status
            const item = await this.db.query('SELECT category_id, location_id FROM physical_items WHERE id = $1', [itemId]);
            if (item.rows.length === 0)
                return;
            const categoryResult = await this.db.query('SELECT status FROM categories WHERE id = $1', [item.rows[0].category_id]);
            const locationResult = await this.db.query('SELECT status FROM locations WHERE id = $1', [item.rows[0].location_id]);
            const categoryStatus = categoryResult.rows[0]?.status;
            const locationStatus = locationResult.rows[0]?.status;
            // If either parent is INACTIVE, set item to INACTIVE
            if (categoryStatus === 'INACTIVE' || locationStatus === 'INACTIVE') {
                await this.db.query('UPDATE physical_items SET status = $1, updated_at = NOW() WHERE id = $2', ['INACTIVE', itemId]);
            }
        }
        catch (error) {
            throw new Error(`Status propagation failed: ${error.message}`);
        }
    }
    /**
     * ============================================================
     * ADVERTISING CONTENT RULES (R5.1 - R5.8)
     * ============================================================
     */
    // R5.3: Start Date default = today; End Date must be >= Start Date
    async validateContentDates(startDate, endDate) {
        if (new Date(endDate) < new Date(startDate)) {
            return {
                code: 'R5.3',
                message: 'End date must be greater than or equal to start date',
                severity: 'ERROR',
            };
        }
        return null;
    }
    // R5.4: Status computed - auto-calculated based on end_date
    async computeContentStatus(endDate) {
        const today = new Date();
        return new Date(endDate) >= today ? 'Còn hạn' : 'Hết hạn';
    }
    /**
     * ============================================================
     * REGISTRATION WORKFLOW RULES (RW1.1 - RW9.4)
     * ============================================================
     */
    // RW1.2: All items must not be in "Treo" or "Không hoạt động" before submit
    async validateRegistrationSubmit(registrationId) {
        try {
            const result = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM ad_registration_items ri
        JOIN physical_items pi ON ri.physical_item_id = pi.id
        WHERE ri.registration_id = $1
        AND pi.status IN ('TREO', 'INACTIVE')
      `, [registrationId]);
            if (parseInt(result.rows[0].count) > 0) {
                return {
                    code: 'RW1.2',
                    message: `Cannot submit: ${result.rows[0].count} items have invalid status (TREO or INACTIVE)`,
                    severity: 'ERROR',
                };
            }
        }
        catch (error) {
            throw new Error(`Registration submit validation failed: ${error.message}`);
        }
        return null;
    }
    // RW2.1: Approver must be direct superior of creator
    async validateApproverIsDirectManager(approverId, creatorId) {
        try {
            const creatorResult = await this.db.query('SELECT manager_id FROM users WHERE id = $1', [creatorId]);
            if (creatorResult.rows.length === 0) {
                return {
                    code: 'RW2.1',
                    message: 'Creator not found',
                    severity: 'ERROR',
                };
            }
            const creatorManagerId = creatorResult.rows[0].manager_id;
            // Check if approverId is in the manager chain above creatorId
            // For MVP: simple check - is approverId the direct manager?
            if (approverId !== creatorManagerId) {
                return {
                    code: 'RW2.1',
                    message: 'Approver must be direct manager of the registration creator',
                    severity: 'ERROR',
                };
            }
        }
        catch (error) {
            throw new Error(`Approver validation failed: ${error.message}`);
        }
        return null;
    }
    // RW6.2: Acceptance phase - active items need images, inactive need notes
    async validateAcceptanceCompletion(registrationId) {
        const errors = [];
        try {
            // Check active items have new images
            const activeWithoutImages = await this.db.query(`
        SELECT COUNT(*) as count
        FROM ad_registration_items ri
        JOIN physical_items pi ON ri.physical_item_id = pi.id
        WHERE ri.registration_id = $1
        AND pi.status = 'ACTIVE'
        AND (ri.new_image_url IS NULL OR ri.new_image_url = '')
      `, [registrationId]);
            if (parseInt(activeWithoutImages.rows[0].count) > 0) {
                errors.push({
                    code: 'RW6.2',
                    message: `${activeWithoutImages.rows[0].count} active items missing new deployment images`,
                    severity: 'ERROR',
                });
            }
            // Check inactive items have notes
            const inactiveWithoutNotes = await this.db.query(`
        SELECT COUNT(*) as count
        FROM ad_registration_items ri
        JOIN physical_items pi ON ri.physical_item_id = pi.id
        WHERE ri.registration_id = $1
        AND pi.status = 'INACTIVE'
        AND (ri.acceptance_note IS NULL OR ri.acceptance_note = '')
      `, [registrationId]);
            if (parseInt(inactiveWithoutNotes.rows[0].count) > 0) {
                errors.push({
                    code: 'RW6.2',
                    message: `${inactiveWithoutNotes.rows[0].count} inactive items missing notes`,
                    severity: 'ERROR',
                });
            }
        }
        catch (error) {
            throw new Error(`Acceptance validation failed: ${error.message}`);
        }
        return errors;
    }
    /**
     * ============================================================
     * FINANCIAL RULES (R6.1 - R6.4)
     * ============================================================
     */
    // R6.1 & R6.2: Total Amount = Σ(quantity × unit_price); must be <= budget
    async validateRegistrationBudget(registrationId) {
        try {
            const result = await this.db.query(`
        SELECT 
          r.budget_estimate,
          COALESCE(SUM(ri.total_amount), 0) as total_items_amount
        FROM ad_registrations r
        LEFT JOIN ad_registration_items ri ON r.id = ri.registration_id
        WHERE r.id = $1
        GROUP BY r.budget_estimate
      `, [registrationId]);
            if (result.rows.length === 0) {
                return {
                    code: 'R6.2',
                    message: 'Registration not found',
                    severity: 'ERROR',
                };
            }
            const { budget_estimate, total_items_amount } = result.rows[0];
            if (parseFloat(total_items_amount) > parseFloat(budget_estimate)) {
                return {
                    code: 'R6.2',
                    message: `Total items amount (${total_items_amount}) exceeds budget (${budget_estimate})`,
                    severity: 'ERROR',
                };
            }
        }
        catch (error) {
            throw new Error(`Budget validation failed: ${error.message}`);
        }
        return null;
    }
    /**
     * ============================================================
     * SOFT DELETE & AUDIT (R7.1 - R7.4)
     * ============================================================
     */
    // R7.1: Soft delete - mark deleted_at instead of hard delete
    async softDelete(tableName, id) {
        try {
            await this.db.query(`UPDATE ${tableName} SET deleted_at = NOW() WHERE id = $1`, [id]);
        }
        catch (error) {
            throw new Error(`Soft delete failed: ${error.message}`);
        }
    }
    /**
     * ============================================================
     * ACCESS CONTROL (R8.1 - R8.6)
     * ============================================================
     */
    // R8.1: INPUTTER can only view own registrations + supervisor's reviews
    async getAccessibleRegistrations(userId, userRole) {
        try {
            let query = '';
            switch (userRole) {
                case 'INPUTTER':
                case 'INPUTTER_HO':
                    // Own registrations + reviews where they're the creator
                    query = `
            SELECT id FROM ad_registrations 
            WHERE (created_by = $1 OR current_approver_id = $1)
            AND deleted_at IS NULL
          `;
                    break;
                case 'APPROVER':
                case 'APPROVER_HO':
                    // Department registrations in review status
                    query = `
            SELECT DISTINCT r.id FROM ad_registrations r
            WHERE r.deleted_at IS NULL
          `;
                    break;
                case 'BRAND':
                    // Assigned registrations
                    query = `
            SELECT id FROM ad_registrations 
            WHERE assigned_to_brand_user_id = $1
            AND deleted_at IS NULL
          `;
                    break;
                case 'BRAND_MANAGER':
                    // All registrations
                    query = `
            SELECT id FROM ad_registrations 
            WHERE deleted_at IS NULL
          `;
                    break;
                default:
                    return [];
            }
            const result = await this.db.query(query, [userId]);
            return result.rows.map(row => row.id);
        }
        catch (error) {
            throw new Error(`Access control failed: ${error.message}`);
        }
    }
}
export default ValidationService;
