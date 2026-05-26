import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cms_physical_ads',
});

async function main() {
  const client = await pool.connect();

  try {
    const userResult = await client.query(
      `SELECT u.id
         FROM users u
         JOIN roles r ON r.id = u.role_id
        WHERE lower(u.email) = lower($1)
          AND u.deleted_at IS NULL
        LIMIT 1`,
      ['requester@example.com'],
    );

    if (!userResult.rowCount) {
      throw new Error('Requester user not found');
    }

    const userId = userResult.rows[0].id as string;

    const contentResult = await client.query(
      'SELECT id FROM advertising_contents ORDER BY created_at ASC LIMIT 2',
    );

    if (!contentResult.rowCount) {
      throw new Error('No advertising contents found');
    }

    const masterResult = await client.query(
      `SELECT
          (SELECT id FROM channels ORDER BY created_at ASC LIMIT 1) AS channel_id,
          (SELECT id FROM categories ORDER BY created_at ASC LIMIT 1) AS category_id,
          (SELECT id FROM locations ORDER BY created_at ASC LIMIT 1) AS location_id,
          (SELECT unit_price FROM categories ORDER BY created_at ASC LIMIT 1) AS unit_price`,
    );

    const masterRow = masterResult.rows[0];
    if (!masterRow.channel_id || !masterRow.category_id || !masterRow.location_id) {
      throw new Error('Missing master data to seed physical items');
    }

    const itemSeeds = [
      { item_code: 'LOC.SEED.0001', item_name: 'Seed Billboard 1', seq_no: 1 },
      { item_code: 'LOC.SEED.0002', item_name: 'Seed Billboard 2', seq_no: 2 },
      { item_code: 'LOC.SEED.0003', item_name: 'Seed Billboard 3', seq_no: 3 },
    ];

    const itemIds: string[] = [];
    for (const seed of itemSeeds) {
      const existing = await client.query(
        'SELECT id FROM physical_items WHERE item_code = $1 LIMIT 1',
        [seed.item_code],
      );

      if (existing.rowCount) {
        itemIds.push(existing.rows[0].id as string);
        continue;
      }

      const inserted = await client.query(
        `INSERT INTO physical_items(
          channel_id, category_id, location_id, seq_no, item_code, item_name,
          width, length, image_key, description, status, created_by, updated_by
        ) VALUES ($1,$2,$3,$4,$5,$6,12.50,8.00,NULL,$7,'ACTIVE',$8,$8)
        RETURNING id`,
        [
          masterRow.channel_id,
          masterRow.category_id,
          masterRow.location_id,
          seed.seq_no,
          seed.item_code,
          seed.item_name,
          seed.item_name,
          userId,
        ],
      );
      itemIds.push(inserted.rows[0].id as string);
    }

    const registrations = [
      {
        registration_no: 'REG-SEED-001',
        campaign_name: 'Seed Campaign Alpha',
        campaign_description: 'Seeded campaign for UI testing',
        budget_estimate: 30000,
        representative_name: 'Requester User',
        representative_phone: '0123456789',
        status: 'DRAFT',
      },
      {
        registration_no: 'REG-SEED-002',
        campaign_name: 'Seed Campaign Beta',
        campaign_description: 'Second seeded campaign for review flow',
        budget_estimate: 22000,
        representative_name: 'Requester User',
        representative_phone: '0123456789',
        status: 'REVISION_REQUIRED',
      },
    ] as const;

    for (let index = 0; index < registrations.length; index += 1) {
      const reg = registrations[index];
      const contentId = contentResult.rows[index % contentResult.rowCount].id as string;

      const existing = await client.query(
        'SELECT id FROM advertising_registrations WHERE registration_no = $1 LIMIT 1',
        [reg.registration_no],
      );

      let registrationId: string;
      if (existing.rowCount) {
        registrationId = existing.rows[0].id as string;
      } else {
        const inserted = await client.query(
          `INSERT INTO advertising_registrations(
            registration_no, campaign_name, campaign_description, budget_estimate,
            start_date, end_date, document_key, representative_name, representative_phone,
            content_id, status, created_by, updated_by
          ) VALUES (
            $1,$2,$3,$4,
            CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', NULL, $5, $6,
            $7, $8, $9, $9
          )
          RETURNING id`,
          [
            reg.registration_no,
            reg.campaign_name,
            reg.campaign_description,
            reg.budget_estimate,
            reg.representative_name,
            reg.representative_phone,
            contentId,
            reg.status,
            userId,
          ],
        );
        registrationId = inserted.rows[0].id as string;
      }

      await client.query('DELETE FROM registration_items WHERE registration_id = $1', [registrationId]);
      await client.query(
        `INSERT INTO registration_items(registration_id, physical_item_id, unit_price, quantity)
         VALUES ($1, $2, $3, 1)`,
        [registrationId, itemIds[index], Number(masterRow.unit_price) + index * 1500],
      );
    }

    console.log(JSON.stringify({ seededPhysicalItems: itemIds.length, seededRegistrations: registrations.length }, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});