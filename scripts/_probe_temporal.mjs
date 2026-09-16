import pg from "pg";
const regiones = ["sa-east-1","us-east-1","us-east-2","us-west-1","us-west-2","eu-central-1","eu-west-1","eu-west-2","ap-southeast-1","ap-southeast-2","ap-south-1"];
for (const region of regiones) {
  for (const port of [6543, 5432]) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const client = new pg.Client({
      host, port,
      user: "postgres.zubxhflrdbtychvkfksw",
      password: "DATABASE_URL=hC,_F4qeUwWaw2T",
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000,
    });
    try {
      await client.connect();
      console.log("EXITO:", region, port);
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log("falló", region, port, "-", err.message.slice(0,60));
      try { await client.end(); } catch {}
    }
  }
}
console.log("Ninguna región/puerto funcionó.");
