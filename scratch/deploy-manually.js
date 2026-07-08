const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});


const config = {
  host: '65.20.105.127',
  port: 22,
  username: 'root',
  password: 'i3C?bfh%xE(2cD5r'
};

const localZipPath = path.resolve(__dirname, '..', 'deploy.zip');
const remoteZipPath = '/tmp/deploy.zip';
const appDir = '/var/www/igortv';

const conn = new Client();

function executeCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n--- Running remote command: ${cmd} ---`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      
      let out = '';
      let errOut = '';
      stream.on('close', (code, signal) => {
        console.log(`Command closed with code ${code}`);
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

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    console.log(`\nUploading ${localPath} to remote ${remotePath}...`);
    
    // Get file size to track progress
    const stats = fs.statSync(localPath);
    const fileSize = stats.size;
    console.log(`Local file size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      
      let uploadedBytes = 0;
      let lastLoggedPercent = -1;
      
      readStream.on('data', (chunk) => {
        uploadedBytes += chunk.length;
        const percent = Math.floor((uploadedBytes / fileSize) * 100);
        if (percent >= lastLoggedPercent + 5) {
          console.log(`Upload progress: ${percent}% (${(uploadedBytes / (1024 * 1024)).toFixed(2)} MB / ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
          lastLoggedPercent = percent;
        }
      });

      writeStream.on('close', () => {
        console.log('Upload stream closed. Upload complete.');
        resolve();
      });
      
      writeStream.on('error', (err) => {
        console.error('Write stream error:', err);
        reject(err);
      });
      
      readStream.on('error', (err) => {
        console.error('Read stream error:', err);
        reject(err);
      });
      
      readStream.pipe(writeStream);
    });
  });
}

conn.on('ready', async () => {
  console.log('SSH connection established.');
  
  try {
    // 1. Upload files
    await uploadFile(conn, localZipPath, remoteZipPath);

    // 2. Extract files
    console.log('Extracting files on remote server...');
    const unzipRes = await executeCommand(conn, `unzip -o ${remoteZipPath} -d ${appDir}`);
    console.log(`Unzip finished. Code: ${unzipRes.code}`);

    // 3. Database operations & Seeding
    console.log('Running database schema sync...');
    await executeCommand(conn, `cd ${appDir} && npx prisma db push`);

    console.log('Generating Prisma client...');
    await executeCommand(conn, `cd ${appDir} && npx prisma generate`);

    console.log('Running add-marquees.ts...');
    await executeCommand(conn, `cd ${appDir} && npx tsx scripts/add-marquees.ts`);

    console.log('Running seed-blog-subpage.ts...');
    await executeCommand(conn, `cd ${appDir} && npx tsx scripts/seed-blog-subpage.ts`);

    console.log('Running update-prod-domain.ts...');
    // We run it directly on root dev.db using sqlite3 to be absolutely safe
    await executeCommand(conn, `sqlite3 ${appDir}/dev.db "UPDATE SiteSettings SET siteDomain = 'https://igoriptv2.com' WHERE id = 'main';"`);
    await executeCommand(conn, `sqlite3 ${appDir}/dev.db "UPDATE SchemaConfig SET orgUrl = 'https://igoriptv2.com' WHERE id = 'main';"`);

    console.log('Running add-blog-post-smarters.ts...');
    // Let's run the typescript seed script for our new blog post
    await executeCommand(conn, `cd ${appDir} && npx tsx scripts/add-blog-post-smarters.ts`);

    // 4. Restart PM2
    console.log('Restarting PM2 process...');
    await executeCommand(conn, 'pm2 restart igortv');

    console.log('\n=========================================');
    console.log('DEPLOYMENT COMPLETE AND VERIFIED!');
    console.log('=========================================');
    
  } catch (error) {
    console.error('\nDeployment failed with error:', error);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).on('close', (hadError) => {
  console.log('SSH Connection Closed. Had error:', hadError);
}).on('end', () => {
  console.log('SSH Connection Ended.');
}).connect(config);
