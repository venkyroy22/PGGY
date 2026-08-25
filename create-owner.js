const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Get the DB URL from the env or use a hardcoded one for this script
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.ttibuerzfxhdoonnibzx:pggloyas%4022102004@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node create-owner.js <name> <email> <password> [phone]');
    console.log('Example: node create-owner.js "Admin" admin@example.com mypassword123 9999999999');
    process.exit(1);
  }

  const [name, email, password, phone = Date.now().toString().slice(-10)] = args;

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    
    // Check if owner already exists
    const existingRes = await client.query('SELECT id FROM owners WHERE email = $1', [email]);
    if (existingRes.rows.length > 0) {
      console.error('❌ An owner with this email already exists.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID(); // Generate a CUID-like ID
    
    // Insert into DB directly
    const res = await client.query(
      `INSERT INTO owners (id, name, email, password_hash, phone, role, status, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 'ADMIN', 'ACTIVE', NOW()) 
       RETURNING id, name, email, phone, role`,
      [id, name, email, passwordHash, phone]
    );

    const owner = res.rows[0];

    console.log('\n✅ Admin Owner created successfully!');
    console.log('---------------------------');
    console.log(`ID:       ${owner.id}`);
    console.log(`Name:     ${owner.name}`);
    console.log(`Email:    ${owner.email}`);
    console.log(`Phone:    ${owner.phone}`);
    console.log(`Role:     ${owner.role}`);
    console.log('---------------------------\n');
  } catch (error) {
    console.error('❌ Failed to create owner:', error.message);
  } finally {
    await client.end();
  }
}

main();
