async function getFirstId(db, sql) {
    const result = await db.query(sql);
    return result.rowCount ? result.rows[0].id : null;
}
export async function seedSampleCampaignData(db) {
    const catalogMarker = await db.query('SELECT id FROM physical_items WHERE item_code = $1 LIMIT 1', ['PMH.DL.01']);
    const seededRegistration = await db.query('SELECT id FROM advertising_registrations WHERE registration_no = $1 LIMIT 1', ['REG-SEED-001']);
    if ((catalogMarker.rowCount ?? 0) > 0 || (seededRegistration.rowCount ?? 0) > 0) {
        return;
    }
    const userId = await getFirstId(db, `SELECT u.id
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE lower(u.email) = lower('requester@example.com')
        AND u.deleted_at IS NULL
      LIMIT 1`);
    if (!userId) {
        throw new Error('Cannot seed sample campaigns without requester user');
    }
    const channelId = await getFirstId(db, 'SELECT id FROM channels ORDER BY created_at ASC LIMIT 1');
    const categoryResult = await db.query('SELECT id, unit_price FROM categories ORDER BY created_at ASC LIMIT 1');
    const locationId = await getFirstId(db, 'SELECT id FROM locations ORDER BY created_at ASC LIMIT 1');
    const contentIds = (await db.query('SELECT id FROM advertising_contents ORDER BY created_at ASC LIMIT 2')).rows.map((row) => row.id);
    if (!channelId || !categoryResult.rowCount || !locationId || contentIds.length === 0) {
        throw new Error('Missing master data required for sample campaign seeding');
    }
    const categoryId = categoryResult.rows[0].id;
    const unitPrice = Number(categoryResult.rows[0].unit_price);
    const itemSeeds = [
        { itemCode: 'LOC.SEED.0001', itemName: 'Seed Billboard 1', seqNo: 1 },
        { itemCode: 'LOC.SEED.0002', itemName: 'Seed Billboard 2', seqNo: 2 },
        { itemCode: 'LOC.SEED.0003', itemName: 'Seed Billboard 3', seqNo: 3 },
    ];
    const itemIds = [];
    for (const seed of itemSeeds) {
        const existing = await db.query('SELECT id FROM physical_items WHERE item_code = $1 LIMIT 1', [seed.itemCode]);
        if (existing.rowCount) {
            itemIds.push(existing.rows[0].id);
            continue;
        }
        const inserted = await db.query(`INSERT INTO physical_items(
        channel_id, category_id, location_id, seq_no, item_code, item_name,
        width, length, image_key, description, status, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,12.50,8.00,NULL,$7,'ACTIVE',$8,$8)
      RETURNING id`, [channelId, categoryId, locationId, seed.seqNo, seed.itemCode, seed.itemName, null, userId]);
        itemIds.push(inserted.rows[0].id);
    }
    const registrations = [
        {
            registrationNo: 'REG-SEED-001',
            campaignName: 'Seed Campaign Alpha',
            campaignDescription: 'Seeded campaign for UI testing',
            budgetEstimate: 30000,
            status: 'DRAFT',
        },
        {
            registrationNo: 'REG-SEED-002',
            campaignName: 'Seed Campaign Beta',
            campaignDescription: 'Second seeded campaign for review flow',
            budgetEstimate: 22000,
            status: 'REVISION_REQUIRED',
        },
    ];
    for (let index = 0; index < registrations.length; index += 1) {
        const registration = registrations[index];
        const contentId = contentIds[index % contentIds.length];
        const existing = await db.query('SELECT id FROM advertising_registrations WHERE registration_no = $1 LIMIT 1', [registration.registrationNo]);
        let registrationId;
        if (existing.rowCount) {
            registrationId = existing.rows[0].id;
        }
        else {
            const inserted = await db.query(`INSERT INTO advertising_registrations(
          registration_no, campaign_name, campaign_description, budget_estimate,
          start_date, end_date, document_key, representative_name, representative_phone,
          content_id, status, created_by, updated_by
        ) VALUES (
          $1,$2,$3,$4,
          CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', NULL, 'Requester User', '0123456789',
          $5, $6, $7, $7
        )
        RETURNING id`, [
                registration.registrationNo,
                registration.campaignName,
                registration.campaignDescription,
                registration.budgetEstimate,
                contentId,
                registration.status,
                userId,
            ]);
            registrationId = inserted.rows[0].id;
        }
        await db.query('DELETE FROM registration_items WHERE registration_id = $1', [registrationId]);
        await db.query(`INSERT INTO registration_items(registration_id, physical_item_id, unit_price, quantity)
       VALUES ($1, $2, $3, 1)`, [registrationId, itemIds[index], unitPrice + index * 1500]);
    }
    console.log('[Seed] Sample campaign data is ready');
}
