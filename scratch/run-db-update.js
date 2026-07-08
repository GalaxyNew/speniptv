const { Client } = require('ssh2');

const config = {
  host: '65.20.105.127',
  port: 22,
  username: 'root',
  password: 'i3C?bfh%xE(2cD5r'
};

const conn = new Client();

function executeCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n--- Running remote command: ${cmd} ---`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      
      let out = '';
      let errOut = '';
      stream.on('close', (code, signal) => {
        resolve({ code, out, errOut });
      }).on('data', (data) => {
        out += data.toString();
        process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
        errOut += data.toString();
        process.stderr.write(data.toString());
      });
    });
  });
}

conn.on('ready', async () => {
  console.log('SSH connection established.');
  
  try {
    // 1. Run direct sqlite3 updates for SiteSettings and SchemaConfig
    const resSql1 = await executeCommand(conn, `sqlite3 /var/www/igortv/dev.db "UPDATE SiteSettings SET siteDomain = 'https://igoriptv2.com' WHERE id = 'main';"`);
    console.log(`Sqlite3 SiteSettings update exited with code: ${resSql1.code}`);

    const resSql2 = await executeCommand(conn, `sqlite3 /var/www/igortv/dev.db "UPDATE SchemaConfig SET orgUrl = 'https://igoriptv2.com' WHERE id = 'main';"`);
    console.log(`Sqlite3 SchemaConfig update exited with code: ${resSql2.code}`);

    // 2. Restart PM2 to make sure Next.js picks it up
    const resPm2 = await executeCommand(conn, 'pm2 restart igortv');
    console.log(`PM2 restart exited with code: ${resPm2.code}`);
    
  } catch (error) {
    console.error('Remote execution failed:', error);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect(config);
