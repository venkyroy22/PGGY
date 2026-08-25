const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres.ttibuerzfxhdoonnibzx:pggloyas%4022102004@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres' });
  await client.connect();
  const res = await client.query("SELECT id, email, role FROM owners WHERE email = 'gloyas.connect@gmail.com'");
  console.log(res.rows);
  await client.end();
}
main();
