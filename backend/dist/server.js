import dotenv from 'dotenv';
dotenv.config();
import { app } from './app.js';
import { seedSampleCampaignData } from './db/seedSampleData.js';
import { db } from './db/pool.js';
const port = Number(process.env.PORT || 4000);
async function start() {
    await seedSampleCampaignData(db);
    app.listen(port, () => {
        console.log(`Backend running on port ${port}`);
    });
}
start().catch((error) => {
    console.error('Failed to start backend:', error);
    process.exit(1);
});
