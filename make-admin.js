const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.ttibuerzfxhdoonnibzx:pggloyas%4022102004@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function main() {
  await client.connect();
  const res = await client.query("UPDATE owners SET role = 'ADMIN' WHERE email = 'admin@example.com'");
  console.log('Rows updated:', res.rowCount);
  await client.end();
}

main();
