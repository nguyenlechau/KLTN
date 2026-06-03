/**
 * ApprovalRoutingService.ts
 * Implements role-based approval routing and manager chain validation
 * Per SYSTEM_SPECIFICATION Section E - Approval Chain Routing
 */
export class ApprovalRoutingService {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Get the next approver in the chain based on registration status and creator role
     * Implements approval routing per specification Section F
     */
    async getNextApprover(registrationId, currentStatus, creatorId) {
        try {
            const creator = await this.db.query('SELECT id, role, manager_id, department_id FROM users WHERE id = $1', [creatorId]);
            if (creator.rows.length === 0) {
                throw new Error('Creator not found');
            }
            const creatorData = creator.rows[0];
            // Determine next approver based on current status
            switch (currentStatus) {
                case 'DRAFT':
                    // If creator is BRAND, skip to BRAND_MANAGER_APPROVAL
                    // Otherwise, go to SUPERVISOR_REVIEW
                    if (creatorData.role === 'BRAND') {
                        return this.routeToBrandManager(creatorData);
                    }
                    else {
                        return this.routeToSupervisor(creatorData);
                    }
                case 'SUPERVISOR_REVIEW':
                    // Route to BRAND intake
                    return this.routeToBrand(registrationId);
                case 'BRAND_INTAKE':
                    // Route to BRAND_MANAGER
                    return this.routeToBrandManager(creatorData);
                case 'ACCEPTANCE':
                    // Route to BRAND_MANAGER for acceptance review
                    return this.routeToBrandManager(creatorData);
                default:
                    return null;
            }
        }
        catch (error) {
            throw new Error(`Approval routing failed: ${error.message}`);
        }
    }
    /**
     * Route to direct manager (APPROVER role)
     * Q2: Approver must be direct manager via manager_id field
     */
    async routeToSupervisor(creatorData) {
        if (!creatorData.manager_id) {
            throw new Error(`Cannot route to supervisor: creator has no manager_id set. User must have organizational hierarchy configured.`);
        }
        try {
            const manager = await this.db.query(`SELECT id, full_name, role, department_id 
         FROM users 
         WHERE id = $1 AND role IN ('APPROVER', 'APPROVER_HO')`, [creatorData.manager_id]);
            if (manager.rows.length === 0) {
                throw new Error(`Manager of creator is not an APPROVER or APPROVER_HO. Cannot proceed with approval.`);
            }
            return {
                approverUserId: manager.rows[0].id,
                approverName: manager.rows[0].full_name,
                approverRole: manager.rows[0].role,
                approverDepartmentId: manager.rows[0].department_id,
                reason: 'Direct manager approval required',
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Route to BRAND user
     * Assignment is category-specific or system-assigned
     */
    async routeToBrand(registrationId) {
        try {
            // For MVP: assign to first available BRAND user
            // Phase 2: Use category-based assignment configuration
            const brand = await this.db.query(`SELECT id, full_name, role, department_id 
         FROM users 
         WHERE role = 'BRAND'
         LIMIT 1`);
            if (brand.rows.length === 0) {
                throw new Error('No BRAND user available for intake assignment');
            }
            return {
                approverUserId: brand.rows[0].id,
                approverName: brand.rows[0].full_name,
                approverRole: brand.rows[0].role,
                approverDepartmentId: brand.rows[0].department_id,
                reason: 'Brand intake review',
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Route to BRAND_MANAGER
     */
    async routeToBrandManager(creatorData) {
        try {
            // Get direct manager of creator if they're BRAND, otherwise get any BRAND_MANAGER
            let managerQuery;
            let params;
            if (creatorData.role === 'BRAND' && creatorData.manager_id) {
                // If creator is BRAND, use their direct manager (should be BRAND_MANAGER)
                managerQuery = `
          SELECT id, full_name, role, department_id 
          FROM users 
          WHERE id = $1 AND role = 'BRAND_MANAGER'
        `;
                params = [creatorData.manager_id];
            }
            else {
                // Otherwise, get first available BRAND_MANAGER
                managerQuery = `
          SELECT id, full_name, role, department_id 
          FROM users 
          WHERE role = 'BRAND_MANAGER'
          LIMIT 1
        `;
                params = [];
            }
            const manager = await this.db.query(managerQuery, params);
            if (manager.rows.length === 0) {
                throw new Error('No BRAND_MANAGER available for approval');
            }
            return {
                approverUserId: manager.rows[0].id,
                approverName: manager.rows[0].full_name,
                approverRole: manager.rows[0].role,
                approverDepartmentId: manager.rows[0].department_id,
                reason: 'Brand manager final approval',
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Validate that an approver is authorized to approve a registration
     * Based on their role and position in approval chain
     */
    async validateApproverAuthorization(approverId, registrationId, currentStatus) {
        try {
            const approver = await this.db.query('SELECT role FROM users WHERE id = $1', [approverId]);
            if (approver.rows.length === 0) {
                return false;
            }
            const approverRole = approver.rows[0].role;
            // Check if role is allowed for current status
            const allowedRoles = {
                'SUPERVISOR_REVIEW': ['APPROVER', 'APPROVER_HO'],
                'BRAND_INTAKE': ['BRAND'],
                'BRAND_MANAGER_APPROVAL': ['BRAND_MANAGER'],
                'ACCEPTANCE_REVIEW': ['BRAND_MANAGER'],
            };
            return allowedRoles[currentStatus]?.includes(approverRole) || false;
        }
        catch (error) {
            throw new Error(`Approver validation failed: ${error.message}`);
        }
    }
    /**
     * Get all users in approval chain for a given creator
     * Useful for bulk notifications or audit purposes
     */
    async getApprovalChain(creatorId) {
        try {
            const creator = await this.db.query('SELECT manager_id FROM users WHERE id = $1', [creatorId]);
            if (creator.rows.length === 0) {
                return [];
            }
            // Walk up the manager chain
            const chain = [];
            let currentUserId = creator.rows[0].manager_id;
            while (currentUserId) {
                const user = await this.db.query('SELECT id, full_name, role, manager_id FROM users WHERE id = $1', [currentUserId]);
                if (user.rows.length === 0)
                    break;
                chain.push(user.rows[0]);
                currentUserId = user.rows[0].manager_id;
            }
            return chain;
        }
        catch (error) {
            throw new Error(`Failed to get approval chain: ${error.message}`);
        }
    }
    /**
     * Check if user A is a manager of user B (direct or indirect)
     */
    async isManagerOf(managerId, userId) {
        try {
            let currentUserId = userId;
            // Walk up the manager chain
            for (let i = 0; i < 10; i++) {
                const user = await this.db.query('SELECT manager_id FROM users WHERE id = $1', [currentUserId]);
                if (user.rows.length === 0)
                    break;
                const parentId = user.rows[0].manager_id;
                if (parentId === managerId) {
                    return true;
                }
                if (!parentId)
                    break;
                currentUserId = parentId;
            }
            return false;
        }
        catch (error) {
            throw new Error(`Manager check failed: ${error.message}`);
        }
    }
}
export default ApprovalRoutingService;
