// In-memory mock database for testing without PostgreSQL
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
function generateId() {
    return crypto.randomBytes(8).toString('hex');
}
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}
class MockDatabase {
    users = new Map();
    channels = new Map();
    categories = new Map();
    locations = new Map();
    contents = new Map();
    physicalItems = new Map();
    registrations = new Map();
    registrationItems = new Map();
    auditLogs = [];
    constructor() {
        const adminId = generateId();
        this.seedTestAccounts(adminId);
        this.seedMasterData(adminId);
    }
    seedTestAccounts(adminId) {
        const testAccounts = [
            { email: 'admin@example.com', fullName: 'Admin User', password: 'password', role: 'ADMIN' },
            { email: 'requester@example.com', fullName: 'Requester User', password: 'password', role: 'REQUESTER' },
            { email: 'central-requester@example.com', fullName: 'Central Requester', password: 'password', role: 'CENTRAL_REQUESTER' },
            { email: 'supervisor@example.com', fullName: 'Supervisor User', password: 'password', role: 'SUPERVISOR' },
            { email: 'central-supervisor@example.com', fullName: 'Central Supervisor', password: 'password', role: 'CENTRAL_SUPERVISOR' },
            { email: 'operations-specialist@example.com', fullName: 'Operations Specialist', password: 'password', role: 'OPERATIONS_SPECIALIST' },
            { email: 'operations-manager@example.com', fullName: 'Operations Manager', password: 'password', role: 'OPERATIONS_MANAGER' },
        ];
        testAccounts.forEach(account => {
            const id = generateId();
            const user = {
                id,
                email: account.email.toLowerCase(),
                full_name: account.fullName,
                password_hash: hashPassword(account.password),
                role: account.role,
                status: 'ACTIVE',
                created_at: new Date().toISOString(),
                deleted_at: null,
            };
            this.users.set(id, user);
        });
        console.log('[MockDB] Seeded', this.users.size, 'test accounts');
    }
    seedMasterData(adminId) {
        const timestamp = new Date().toISOString();
        const channelSeedData = [
            { code: 'CN', name: 'Kênh CN' },
            { code: 'AF', name: 'Kênh AF' },
            { code: 'SME', name: 'Kênh SME' },
            { code: 'OOH', name: 'Kênh OOH' },
            { code: 'HO', name: 'Kênh HO' },
            { code: 'Hệ sinh thái', name: 'Kênh Hệ sinh thái' },
        ];
        for (const channelSeed of channelSeedData) {
            const channelId = generateId();
            this.channels.set(channelId, {
                id: channelId,
                code: channelSeed.code,
                name: channelSeed.name,
                description: `${channelSeed.name} channel`,
                status: 'ACTIVE',
                created_by: adminId,
                updated_by: adminId,
                created_at: timestamp,
                updated_at: timestamp,
            });
        }
        const categorySeedData = [
            { code: 'LB', name: 'Light box', unitPrice: 350000 },
            { code: 'DL', name: 'Decal lưới', unitPrice: 350000 },
            { code: 'HL', name: 'Hilex', unitPrice: 250000 },
            { code: 'DC', name: 'Decal', unitPrice: 200000 },
            { code: 'BN', name: 'Banner khung sắt', unitPrice: 160000 },
            { code: 'ST', name: 'Standee thường', unitPrice: 220000 },
            { code: 'SS', name: 'Standee khung sắt', unitPrice: 300000 },
            { code: 'PF', name: 'Poster frame', unitPrice: 500000 },
            { code: 'OL', name: 'Ốp lưng', unitPrice: 50000 },
            { code: 'MH', name: 'Màn hình LCD', unitPrice: 0 },
            { code: 'MA', name: 'Màn hình ATM', unitPrice: 0 },
            { code: 'HG', name: 'Hanger', unitPrice: 0 },
            { code: 'DM', name: 'Decal thang máy', unitPrice: 0 },
            { code: 'MQ', name: 'Màn hình QC', unitPrice: 0 },
            { code: 'BO', name: 'Billboard OOH', unitPrice: 30000000 },
            { code: 'MO', name: 'Màn hình OOH', unitPrice: 0 },
            { code: 'BP', name: 'Backdrop Prime', unitPrice: 350000 },
        ];
        for (const categorySeed of categorySeedData) {
            const categoryId = generateId();
            this.categories.set(categoryId, {
                id: categoryId,
                code: categorySeed.code,
                name: categorySeed.name,
                description: `${categorySeed.name} category`,
                unit_price: categorySeed.unitPrice,
                status: 'ACTIVE',
                created_by: adminId,
                updated_by: adminId,
                created_at: timestamp,
                updated_at: timestamp,
            });
        }
        const locationSeedPath = path.join(process.cwd(), 'seed-locations.json');
        const itemSeedPath = path.join(process.cwd(), 'seed-items.json');
        let locationSeeds = [];
        let itemSeeds = [];
        try {
            if (fs.existsSync(locationSeedPath)) {
                const parsed = JSON.parse(fs.readFileSync(locationSeedPath, 'utf8'));
                locationSeeds = Array.isArray(parsed.locations) ? parsed.locations : [];
            }
        }
        catch {
            locationSeeds = [];
        }
        try {
            if (fs.existsSync(itemSeedPath)) {
                const parsed = JSON.parse(fs.readFileSync(itemSeedPath, 'utf8'));
                itemSeeds = Array.isArray(parsed.items) ? parsed.items : [];
            }
        }
        catch {
            itemSeeds = [];
        }
        if (locationSeeds.length === 0) {
            locationSeeds = [
                { code: 'PMH', classification: 'PGD', name: 'PGD Phú Mỹ Hưng', province: 'Hồ Chí Minh', subDistrict: 'Nội thành', address: 'Tầng Lửng Và Một Phần Tầng Trệt, Tòa Nhà Phú Mã Dương, A4', channels: ['CN'] },
                { code: 'TML', classification: 'PGD', name: 'PGD Nguyễn Duy Trinh', province: 'Hồ Chí Minh', subDistrict: 'Nội thành', address: 'Số 657 Và 659 Đường Nguyễn Duy Trinh, Phường Bình Trưng', channels: ['CN'] },
                { code: 'QN2', classification: 'CN', name: 'CN Trần Não', province: 'Hồ Chí Minh', subDistrict: 'Nội thành', address: 'Số 188 – 190 Đường Trần Não, Phường An Khánh', channels: ['CN'] },
            ];
        }
        const channelEntries = Array.from(this.channels.values());
        const channelIdByCode = new Map(channelEntries.map((channel) => [channel.code, channel.id]));
        const locationIdByCode = new Map();
        for (const locationSeed of locationSeeds) {
            const locationId = generateId();
            const locationChannels = Array.isArray(locationSeed.channels) ? locationSeed.channels : ['CN'];
            this.locations.set(locationId, {
                id: locationId,
                code: locationSeed.code,
                name: locationSeed.name,
                address_line: locationSeed.address,
                latitude: locationSeed.latitude ?? null,
                longitude: locationSeed.longitude ?? null,
                classification: locationSeed.classification,
                province: locationSeed.province,
                sub_district: locationSeed.subDistrict,
                channels: locationChannels,
                status: 'ACTIVE',
                created_by: adminId,
                updated_by: adminId,
                created_at: timestamp,
                updated_at: timestamp,
            });
            locationIdByCode.set(locationSeed.code, locationId);
        }
        const categoryIdByCode = new Map(Array.from(this.categories.values()).map((category) => [category.code, category.id]));
        let itemCount = 0;
        for (const itemSeed of itemSeeds) {
            const locationId = locationIdByCode.get(itemSeed.location);
            const categoryId = categoryIdByCode.get(itemSeed.category);
            if (!locationId || !categoryId) {
                continue;
            }
            const location = this.locations.get(locationId);
            const preferredChannelCode = location?.channels?.find((code) => channelIdByCode.has(code)) || 'CN';
            const channelId = channelIdByCode.get(preferredChannelCode) || channelEntries[0]?.id;
            const itemId = generateId();
            this.physicalItems.set(itemId, {
                id: itemId,
                channel_id: channelId,
                category_id: categoryId,
                location_id: locationId,
                seq_no: itemCount + 1,
                item_code: itemSeed.code,
                item_name: itemSeed.name,
                width: String(itemSeed.width ?? 0),
                length: String(itemSeed.length ?? 0),
                image_key: null,
                description: itemSeed.description ?? null,
                status: 'ACTIVE',
                created_by: adminId,
                updated_by: adminId,
                created_at: timestamp,
                updated_at: timestamp,
            });
            itemCount += 1;
        }
        const firstChannelId = channelEntries[0]?.id;
        const firstCategoryId = Array.from(this.categories.keys())[0];
        const firstLocationId = Array.from(this.locations.keys())[0];
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        if (firstChannelId && firstCategoryId && firstLocationId) {
            const contentNames = [
                'Summer Campaign 2026',
                'Spring Product Launch',
                'Holiday Special Offer',
            ];
            contentNames.forEach((name, index) => {
                const contentId = generateId();
                this.contents.set(contentId, {
                    id: contentId,
                    channel_id: firstChannelId,
                    category_id: index === 0 ? firstCategoryId : null,
                    name,
                    description: `High-impact advertising campaign: ${name}`,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    image_keys: JSON.stringify([`image_${index + 1}.jpg`]),
                    created_by: adminId,
                    updated_by: adminId,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            });
        }
        console.log('[MockDB] Seeded', this.channels.size, 'channels,', this.categories.size, 'categories,', this.locations.size, 'locations,', this.physicalItems.size, 'physical items,', this.contents.size, 'contents');
    }
    async query(sql, params) {
        const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
        this.users ??= new Map();
        this.channels ??= new Map();
        this.categories ??= new Map();
        this.locations ??= new Map();
        this.contents ??= new Map();
        this.physicalItems ??= new Map();
        this.registrations ??= new Map();
        this.registrationItems ??= new Map();
        this.auditLogs ??= [];
        // Log all queries for debugging
        const sqlStart = sql.substring(0, 80).replace(/\s+/g, ' ').trim();
        console.log('[MockDB Query]', sqlStart, '| Params:', params?.length || 0);
        // Check for auth query FIRST (most specific)
        if (sql.includes('JOIN roles') && sql.includes('u.password_hash = $2') && sql.includes('u.deleted_at IS NULL')) {
            const email = params?.[0];
            const passwordHash = params?.[1];
            const users = Array.from(this.users.values()).filter(u => u.email.toLowerCase() === email?.toLowerCase() &&
                u.password_hash === passwordHash &&
                u.deleted_at === null);
            console.log('[MockDB] Auth query matched, returning', users.length, 'users');
            return { rows: users, rowCount: users.length };
        }
        if (sql.includes('INSERT INTO users')) {
            const id = generateId();
            const user = {
                id,
                email: params?.[0],
                full_name: params?.[1],
                password_hash: params?.[2],
                role: params?.[4],
                status: params?.[3] || 'ACTIVE',
                created_at: new Date().toISOString(),
                deleted_at: null,
            };
            console.log('[MockDB] INSERT user matched - inserting', user.email);
            this.users.set(id, user);
            return { rows: [user], rowCount: 1 };
        }
        if (sql.includes('SELECT COUNT(*)::int AS count FROM advertising_registrations')) {
            return { rows: [{ count: this.registrations?.size ?? 0 }], rowCount: 1 };
        }
        if (sql.includes('SELECT COUNT(*)::int AS count FROM physical_items')) {
            return { rows: [{ count: this.physicalItems?.size ?? 0 }], rowCount: 1 };
        }
        if (sql.includes('SELECT u.id') && sql.includes('JOIN roles r ON r.id = u.role_id') && (sql.includes('requester@example.com') || sql.includes('lower(u.email) = lower($1)'))) {
            const email = params?.[0] ?? 'requester@example.com';
            const user = Array.from(this.users.values()).find((item) => item.email.toLowerCase() === String(email).toLowerCase() && item.deleted_at === null);
            return { rows: user ? [{ id: user.id }] : [], rowCount: user ? 1 : 0 };
        }
        if (sql.includes('SELECT id FROM channels ORDER BY created_at ASC LIMIT 1')) {
            const channel = Array.from(this.channels.values())[0];
            return { rows: channel ? [{ id: channel.id }] : [], rowCount: channel ? 1 : 0 };
        }
        if (sql.includes('SELECT id, unit_price FROM categories ORDER BY created_at ASC LIMIT 1')) {
            const category = Array.from(this.categories.values())[0];
            return { rows: category ? [{ id: category.id, unit_price: category.unit_price }] : [], rowCount: category ? 1 : 0 };
        }
        if (sql.includes('SELECT id FROM locations ORDER BY created_at ASC LIMIT 1')) {
            const location = Array.from(this.locations.values())[0];
            return { rows: location ? [{ id: location.id }] : [], rowCount: location ? 1 : 0 };
        }
        if (sql.includes('SELECT id FROM advertising_contents ORDER BY created_at ASC LIMIT 2')) {
            const rows = Array.from(this.contents.values()).slice(0, 2).map((content) => ({ id: content.id }));
            return { rows, rowCount: rows.length };
        }
        if (sql.includes('SELECT id FROM physical_items WHERE item_code = $1 LIMIT 1')) {
            const itemCode = params?.[0];
            const item = Array.from(this.physicalItems.values()).find((entry) => entry.item_code === itemCode);
            return { rows: item ? [{ id: item.id }] : [], rowCount: item ? 1 : 0 };
        }
        if (sql.includes('SELECT COALESCE(MAX(seq_no), 0)::int AS max_seq FROM physical_items WHERE category_id = $1 AND location_id = $2') ||
            normalizedSql.includes('select coalesce(max(seq_no), 0)::int as max_seq from physical_items where category_id = $1 and location_id = $2')) {
            const categoryId = params?.[0];
            const locationId = params?.[1];
            const maxSeq = Array.from(this.physicalItems.values())
                .filter((item) => item.category_id === categoryId && item.location_id === locationId)
                .reduce((max, item) => Math.max(max, Number(item.seq_no) || 0), 0);
            return { rows: [{ max_seq: maxSeq }], rowCount: 1 };
        }
        if (sql.includes('SELECT id FROM advertising_registrations WHERE registration_no = $1 LIMIT 1')) {
            const registrationNo = params?.[0];
            const registration = Array.from(this.registrations.values()).find((entry) => entry.registration_no === registrationNo);
            return { rows: registration ? [{ id: registration.id }] : [], rowCount: registration ? 1 : 0 };
        }
        if (sql.includes('SELECT * FROM physical_items ORDER BY created_at DESC')) {
            const physicalItems = Array.from(this.physicalItems.values()).sort((left, right) => right.created_at.localeCompare(left.created_at));
            return { rows: physicalItems, rowCount: physicalItems.length };
        }
        if (sql.includes('SELECT status FROM physical_items WHERE id = $1')) {
            const item = this.physicalItems.get(params?.[0]);
            return { rows: item ? [{ status: item.status }] : [], rowCount: item ? 1 : 0 };
        }
        if (sql.includes('INSERT INTO physical_items(')) {
            const id = generateId();
            const item = {
                id,
                channel_id: params?.[0],
                category_id: params?.[1],
                location_id: params?.[2],
                seq_no: params?.[3],
                item_code: params?.[4],
                item_name: params?.[5],
                width: String(params?.[6]),
                length: String(params?.[7]),
                image_key: params?.[8] ?? null,
                description: params?.[9] ?? null,
                status: params?.[10] ?? 'ACTIVE',
                created_by: params?.[11],
                updated_by: params?.[12] ?? params?.[11] ?? null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            this.physicalItems.set(id, item);
            return { rows: [item], rowCount: 1 };
        }
        if (sql.includes('UPDATE physical_items')) {
            const itemId = params?.[0];
            const item = this.physicalItems.get(itemId);
            if (!item) {
                return { rows: [], rowCount: 0 };
            }
            if (params?.[1] !== undefined)
                item.width = String(params[1]);
            if (params?.[2] !== undefined)
                item.length = String(params[2]);
            if (params?.[3] !== undefined)
                item.image_key = params[3];
            if (params?.[4] !== undefined)
                item.description = params[4];
            if (params?.[5] !== undefined)
                item.updated_by = params[5];
            item.updated_at = new Date().toISOString();
            return { rows: [item], rowCount: 1 };
        }
        if (sql.includes('SELECT * FROM advertising_registrations WHERE id = $1')) {
            const registration = this.registrations.get(params?.[0]);
            if (!registration) {
                return { rows: [], rowCount: 0 };
            }
            const selectedItemIds = Array.from(this.registrationItems.values())
                .filter((item) => item.registration_id === registration.id)
                .sort((left, right) => left.created_at.localeCompare(right.created_at))
                .map((item) => item.physical_item_id);
            return {
                rows: [{ ...registration, budget_estimate: Number(registration.budget_estimate), selectedItemIds }],
                rowCount: 1,
            };
        }
        if (sql.includes('SELECT * FROM advertising_registrations ORDER BY created_at DESC')) {
            const registrations = Array.from(this.registrations.values())
                .sort((left, right) => right.created_at.localeCompare(left.created_at))
                .map((registration) => ({ ...registration, budget_estimate: Number(registration.budget_estimate) }));
            return { rows: registrations, rowCount: registrations.length };
        }
        if (sql.includes('INSERT INTO advertising_registrations(')) {
            const id = generateId();
            const registration = {
                id,
                registration_no: params?.[0],
                campaign_name: params?.[1],
                campaign_description: params?.[2] ?? null,
                budget_estimate: String(params?.[3]),
                start_date: params?.[4],
                end_date: params?.[5],
                document_key: params?.[6] ?? null,
                representative_name: params?.[7] ?? null,
                representative_phone: params?.[8] ?? null,
                content_id: params?.[9] ?? null,
                status: 'DRAFT',
                created_by: params?.[10],
                updated_by: params?.[11] ?? params?.[10] ?? null,
                submitted_at: null,
                approved_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            this.registrations.set(id, registration);
            return { rows: [{ ...registration, budget_estimate: Number(registration.budget_estimate) }], rowCount: 1 };
        }
        if (sql.includes('UPDATE advertising_registrations')) {
            const registration = this.registrations.get(params?.[0]);
            if (!registration) {
                return { rows: [], rowCount: 0 };
            }
            if (sql.includes('SET status = $2')) {
                if (params?.[1] !== undefined)
                    registration.status = params[1];
                if (params?.[2] === 'SET_APPROVED_AT')
                    registration.approved_at = new Date().toISOString();
                if (params?.[3] !== undefined)
                    registration.updated_by = params[3];
                registration.updated_at = new Date().toISOString();
                return { rows: [{ ...registration, budget_estimate: Number(registration.budget_estimate) }], rowCount: 1 };
            }
            if (params?.[1] !== undefined)
                registration.campaign_name = params[1];
            if (params?.[2] !== undefined)
                registration.campaign_description = params[2];
            if (params?.[3] !== undefined)
                registration.budget_estimate = String(params[3]);
            if (params?.[4] !== undefined)
                registration.start_date = params[4];
            if (params?.[5] !== undefined)
                registration.end_date = params[5];
            if (params?.[6] !== undefined)
                registration.document_key = params[6];
            if (params?.[7] !== undefined)
                registration.representative_name = params[7];
            if (params?.[8] !== undefined)
                registration.representative_phone = params[8];
            if (params?.[9] !== undefined)
                registration.content_id = params[9];
            if (params?.[10] !== undefined)
                registration.updated_by = params[10];
            registration.updated_at = new Date().toISOString();
            return { rows: [{ ...registration, budget_estimate: Number(registration.budget_estimate) }], rowCount: 1 };
        }
        if (sql.includes('DELETE FROM registration_items')) {
            const registrationId = params?.[0];
            for (const [itemId, item] of Array.from(this.registrationItems.entries())) {
                if (item.registration_id === registrationId) {
                    this.registrationItems.delete(itemId);
                }
            }
            return { rows: [], rowCount: 0 };
        }
        if (sql.includes('INSERT INTO registration_items')) {
            const registrationItem = {
                id: generateId(),
                registration_id: params?.[0],
                physical_item_id: params?.[1],
                unit_price: String(params?.[2]),
                quantity: params?.[3] ?? 1,
                note: params?.[4] ?? null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            this.registrationItems.set(registrationItem.id, registrationItem);
            return { rows: [registrationItem], rowCount: 1 };
        }
        if (sql.includes('SELECT physical_item_id FROM registration_items WHERE registration_id = $1')) {
            const registrationId = params?.[0];
            const rows = Array.from(this.registrationItems.values())
                .filter((item) => item.registration_id === registrationId)
                .sort((left, right) => left.created_at.localeCompare(right.created_at))
                .map((item) => ({ physical_item_id: item.physical_item_id }));
            return { rows, rowCount: rows.length };
        }
        if (sql.includes('SELECT COALESCE(SUM(total_amount),0)::numeric AS total FROM registration_items WHERE registration_id = $1')) {
            const registrationId = params?.[0];
            const total = Array.from(this.registrationItems.values())
                .filter((item) => item.registration_id === registrationId)
                .reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
            return { rows: [{ total }], rowCount: 1 };
        }
        // Channels queries
        if ((sql.includes('SELECT ch.*') && sql.includes('LEFT JOIN locations l ON ch.location_id = l.id')) ||
            (normalizedSql.includes('select ch.*') && normalizedSql.includes('left join locations l on ch.location_id = l.id'))) {
            const rows = Array.from(this.channels.values()).map((channel) => {
                const location = Array.from(this.locations.values()).find((entry) => entry.id === channel.location_id);
                return {
                    ...channel,
                    location_id: channel.location_id ?? null,
                    location_code: location?.code ?? null,
                    location_name: location?.name ?? null,
                };
            });
            return { rows, rowCount: rows.length };
        }
        if (sql.includes('SELECT * FROM channels')) {
            const channels = Array.from(this.channels.values());
            console.log('[MockDB] SELECT channels matched - returning', channels.length);
            return { rows: channels, rowCount: channels.length };
        }
        if (sql.includes('INSERT INTO channels')) {
            const id = generateId();
            const channel = {
                id,
                code: params?.[0],
                name: params?.[1],
                description: params?.[2] || null,
                location_id: params?.[3],
                status: 'ACTIVE',
                created_by: params?.[4],
                updated_by: params?.[4],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            console.log('[MockDB] INSERT channel matched - inserting', channel.name);
            this.channels.set(id, channel);
            return { rows: [channel], rowCount: 1 };
        }
        if (sql.includes('UPDATE channels')) {
            const channelId = params?.[0];
            const channel = this.channels.get(channelId);
            if (!channel) {
                return { rows: [], rowCount: 0 };
            }
            if (params?.[1] !== null && params?.[1] !== undefined)
                channel.name = params[1];
            if (params?.[2] !== null && params?.[2] !== undefined)
                channel.description = params[2];
            if (params?.[3] !== null && params?.[3] !== undefined)
                channel.status = params[3];
            if (params?.[4] !== null && params?.[4] !== undefined)
                channel.location_id = params[4];
            if (params?.[5] !== null && params?.[5] !== undefined)
                channel.updated_by = params[5];
            channel.updated_at = new Date().toISOString();
            this.channels.set(channelId, channel);
            return { rows: [channel], rowCount: 1 };
        }
        // Categories queries
        if (sql.includes('SELECT id, code, name, description, unit_price, status FROM categories ORDER BY code ASC') || normalizedSql.includes('select id, code, name, description, unit_price, status from categories order by code asc')) {
            const categories = Array.from(this.categories.values()).sort((left, right) => left.code.localeCompare(right.code));
            return { rows: categories, rowCount: categories.length };
        }
        if (sql.includes('SELECT * FROM categories')) {
            const categories = Array.from(this.categories.values());
            console.log('[MockDB] SELECT categories matched - returning', categories.length);
            return { rows: categories, rowCount: categories.length };
        }
        if (sql.includes('INSERT INTO categories')) {
            const id = generateId();
            const category = {
                id,
                code: params?.[0],
                name: params?.[1],
                description: params?.[2] || null,
                unit_price: params?.[3] || 0,
                status: 'ACTIVE',
                created_by: params?.[5],
                updated_by: params?.[6] ?? params?.[5],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            console.log('[MockDB] INSERT category matched - inserting', category.name);
            this.categories.set(id, category);
            return { rows: [category], rowCount: 1 };
        }
        if (sql.includes('SELECT * FROM categories WHERE id = $1')) {
            const categoryId = params?.[0];
            const category = this.categories.get(categoryId);
            return { rows: category ? [category] : [], rowCount: category ? 1 : 0 };
        }
        if (sql.includes('SELECT id FROM categories WHERE id = $1') || normalizedSql.includes('select id from categories where id = $1')) {
            const categoryId = params?.[0];
            const category = this.categories.get(categoryId);
            return { rows: category ? [{ id: category.id }] : [], rowCount: category ? 1 : 0 };
        }
        if (sql.includes('SELECT id, code, name, status FROM categories WHERE id = $1')) {
            const categoryId = params?.[0];
            const category = this.categories.get(categoryId);
            return {
                rows: category ? [{ id: category.id, code: category.code, name: category.name, status: category.status }] : [],
                rowCount: category ? 1 : 0,
            };
        }
        if (sql.includes('UPDATE categories')) {
            const categoryId = params?.[0];
            const category = this.categories.get(categoryId);
            if (!category) {
                return { rows: [], rowCount: 0 };
            }
            if (params?.[1] !== null && params?.[1] !== undefined)
                category.name = params[1];
            if (params?.[2] !== null && params?.[2] !== undefined)
                category.description = params[2];
            if (params?.[3] !== null && params?.[3] !== undefined)
                category.status = params[3];
            if (params?.[4] !== null && params?.[4] !== undefined)
                category.unit_price = params[4];
            if (params?.[5] !== null && params?.[5] !== undefined)
                category.updated_by = params[5];
            category.updated_at = new Date().toISOString();
            this.categories.set(categoryId, category);
            return { rows: [category], rowCount: 1 };
        }
        // Locations queries
        if (sql.includes('SELECT id, code, name, address_line, latitude, longitude, status FROM locations ORDER BY code ASC') || normalizedSql.includes('select id, code, name, address_line, latitude, longitude, status from locations order by code asc')) {
            const locations = Array.from(this.locations.values()).sort((left, right) => left.code.localeCompare(right.code));
            return { rows: locations, rowCount: locations.length };
        }
        if (sql.includes('SELECT * FROM locations')) {
            const locations = Array.from(this.locations.values());
            console.log('[MockDB] SELECT locations matched - returning', locations.length);
            return { rows: locations, rowCount: locations.length };
        }
        if (sql.includes('SELECT id FROM locations WHERE id = $1') || normalizedSql.includes('select id from locations where id = $1')) {
            const locationId = params?.[0];
            const location = this.locations.get(locationId);
            return { rows: location ? [{ id: location.id }] : [], rowCount: location ? 1 : 0 };
        }
        if (sql.includes('SELECT id, code, name, status FROM locations WHERE id = $1')) {
            const locationId = params?.[0];
            const location = this.locations.get(locationId);
            return {
                rows: location ? [{ id: location.id, code: location.code, name: location.name, status: location.status }] : [],
                rowCount: location ? 1 : 0,
            };
        }
        if (sql.includes('SELECT c.status AS category_status, l.status AS location_status')) {
            const categoryId = params?.[0];
            const locationId = params?.[1];
            const category = this.categories.get(categoryId);
            const location = this.locations.get(locationId);
            const channel = Array.from(this.channels.values()).find((entry) => entry.location_id === locationId) ?? Array.from(this.channels.values())[0];
            if (!category || !location) {
                return { rows: [], rowCount: 0 };
            }
            return {
                rows: [{ category_status: category.status, location_status: location.status, channel_id: channel?.id ?? null }],
                rowCount: 1,
            };
        }
        if (sql.includes('INSERT INTO locations')) {
            const id = generateId();
            const location = {
                id,
                code: params?.[0],
                name: params?.[1],
                address_line: params?.[2] || null,
                latitude: params?.[3] || null,
                longitude: params?.[4] || null,
                status: 'ACTIVE',
                created_by: params?.[5],
                updated_by: params?.[6] ?? params?.[5],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            console.log('[MockDB] INSERT location matched - inserting', location.name);
            this.locations.set(id, location);
            return { rows: [location], rowCount: 1 };
        }
        if (sql.includes('UPDATE locations')) {
            const locationId = params?.[0];
            const location = this.locations.get(locationId);
            if (!location) {
                return { rows: [], rowCount: 0 };
            }
            if (params?.[1] !== null && params?.[1] !== undefined)
                location.name = params[1];
            if (params?.[2] !== null && params?.[2] !== undefined)
                location.address_line = params[2];
            if (params?.[3] !== null && params?.[3] !== undefined)
                location.latitude = params[3];
            if (params?.[4] !== null && params?.[4] !== undefined)
                location.longitude = params[4];
            if (params?.[5] !== null && params?.[5] !== undefined)
                location.status = params[5];
            if (params?.[6] !== null && params?.[6] !== undefined)
                location.updated_by = params[6];
            location.updated_at = new Date().toISOString();
            this.locations.set(locationId, location);
            return { rows: [location], rowCount: 1 };
        }
        // Contents queries
        if (sql.includes('SELECT * FROM advertising_contents WHERE id = $1')) {
            const contentId = params?.[0];
            const content = this.contents.get(contentId);
            return { rows: content ? [content] : [], rowCount: content ? 1 : 0 };
        }
        if (sql.includes('SELECT *') && sql.includes('FROM advertising_contents')) {
            const contents = Array.from(this.contents.values()).map(c => ({
                ...c,
                computed_status: new Date(c.end_date) > new Date() ? 'CON_HAN' : 'HET_HAN',
            }));
            console.log('[MockDB] SELECT contents matched - returning', contents.length);
            return { rows: contents, rowCount: contents.length };
        }
        if (sql.includes('INSERT INTO advertising_contents')) {
            const id = generateId();
            const content = {
                id,
                channel_id: params?.[0],
                category_id: params?.[1] || null,
                name: params?.[2],
                description: params?.[3] || null,
                start_date: params?.[4],
                end_date: params?.[5],
                image_keys: params?.[6] || '[]',
                created_by: params?.[7],
                updated_by: params?.[7],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            console.log('[MockDB] INSERT content matched - inserting', content.name);
            this.contents.set(id, content);
            return { rows: [content], rowCount: 1 };
        }
        if (sql.includes('UPDATE advertising_contents')) {
            const contentId = params?.[0];
            const content = this.contents.get(contentId) || Array.from(this.contents.values()).find((item) => item.id === contentId);
            if (!content) {
                console.log('[MockDB] UPDATE content not found for ID:', contentId, 'Known IDs:', Array.from(this.contents.keys()));
                return { rows: [], rowCount: 0 };
            }
            if (params?.[1] !== null && params?.[1] !== undefined)
                content.name = params[1];
            if (params?.[2] !== null && params?.[2] !== undefined)
                content.description = params[2];
            if (params?.[3] !== null && params?.[3] !== undefined)
                content.start_date = params[3];
            if (params?.[4] !== null && params?.[4] !== undefined)
                content.end_date = params[4];
            if (params?.[5] !== null && params?.[5] !== undefined)
                content.image_keys = params[5];
            if (params?.[6] !== null && params?.[6] !== undefined)
                content.updated_by = params[6];
            content.updated_at = new Date().toISOString();
            this.contents.set(contentId, content);
            return { rows: [content], rowCount: 1 };
        }
        // For SELECT queries on users, need to check structure carefully
        if (sql.includes('SELECT u.id') && sql.includes('FROM users u')) {
            if (sql.includes('WHERE u.id = $1')) {
                const userId = params?.[0];
                const user = Array.from(this.users.values()).find(u => u.id === userId && u.deleted_at === null);
                console.log('[MockDB] SELECT user by ID matched for ID:', userId, '- Found:', !!user);
                return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
            }
            else if (sql.includes('WHERE u.deleted_at IS NULL') || (!sql.includes('WHERE') || sql.includes('WHERE u.deleted_at'))) {
                const users = Array.from(this.users.values()).filter(u => u.deleted_at === null);
                console.log('[MockDB] SELECT all users matched - returning', users.length);
                return { rows: users, rowCount: users.length };
            }
        }
        if (sql.includes('UPDATE users SET')) {
            if (sql.includes('deleted_at')) {
                const userId = params?.[1];
                const user = this.users.get(userId);
                if (user) {
                    user.deleted_at = new Date().toISOString();
                    return { rows: [user], rowCount: 1 };
                }
                return { rows: [], rowCount: 0 };
            }
            else {
                const userId = params?.[params.length - 1];
                const user = this.users.get(userId);
                if (user) {
                    if (params?.[0])
                        user.email = params[0];
                    if (params?.[1])
                        user.full_name = params[1];
                    if (params?.[2])
                        user.status = params[2];
                    return { rows: [user], rowCount: 1 };
                }
                return { rows: [], rowCount: 0 };
            }
        }
        console.log('[MockDB] NO MATCH for query:', sqlStart);
        return { rows: [], rowCount: 0 };
    }
    on(event, callback) {
        // Mock event handler
    }
}
export const mockDb = new MockDatabase();
