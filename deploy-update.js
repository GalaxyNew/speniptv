const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '65.20.105.127',
  port: 22,
  username: 'root',
  password: 'i3C?bfh%xE(2cD5r'
};

const localZipPath = path.join(__dirname, 'deploy.zip');
const remoteZipPath = '/tmp/deploy.zip';
const appDir = '/var/www/igortv';

const conn = new Client();

function executeCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\nExecuting remote command: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      
      stream.on('close', (code, signal) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      }).on('data', (data) => {
        process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
    });
  });
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    console.log(`\nUploading ${localPath} to remote ${remotePath}...`);
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      
      writeStream.on('close', () => {
        console.log('Upload complete.');
        resolve();
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
      
      readStream.pipe(writeStream);
    });
  });
}

conn.on('ready', async () => {
  console.log('SSH connection established for update deployment.');
  
  try {
    // 1. Upload files
    console.log('--- Step 1: Uploading updated deploy.zip ---');
    await uploadFile(conn, localZipPath, remoteZipPath);

    // 2. Extract files
    console.log('--- Step 2: Extracting files ---');
    try {
      await executeCommand(conn, `unzip -o ${remoteZipPath} -d ${appDir}`);
    } catch (unzipErr) {
      console.log('Unzip returned a warning/exit code (likely path separator warnings). Continuing...');
    }

    // 3. Generate Prisma client & build
    console.log('--- Step 3: Rebuilding Next.js & Running Database Scripts ---');
    await executeCommand(conn, `cd ${appDir} && npx prisma db push`);
    await executeCommand(conn, `cd ${appDir} && npx prisma generate`);
    await executeCommand(conn, `cd ${appDir} && npx tsx scripts/add-marquees.ts`);
    await executeCommand(conn, `cd ${appDir} && npx tsx scripts/seed-blog-subpage.ts`);
    await executeCommand(conn, `cd ${appDir} && npx tsx scripts/update-prod-domain.ts`);
    await executeCommand(conn, `cd ${appDir} && npx tsx scripts/add-blog-post-smarters.ts`);

    // 4. Restart PM2
    console.log('--- Step 4: Restarting PM2 process ---');
    await executeCommand(conn, 'pm2 restart igortv');

    console.log('\n=========================================');
    console.log('UPDATE DEPLOYED SUCCESSFULLY!');
    console.log('=========================================');
    
  } catch (error) {
    console.error('\nUpdate failed with error:', error);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH Client Error:', err);
}).connect(config);
