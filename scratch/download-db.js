const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '65.20.105.127',
  port: 22,
  username: 'root',
  password: 'i3C?bfh%xE(2cD5r'
};

const remoteDbPath = '/var/www/igortv/dev.db';
const localDbPath = path.join(__dirname, '..', 'dev.db');
const localDbBackupPath = path.join(__dirname, '..', 'dev.db.local.bak');

// 1. Backup local db if it exists
if (fs.existsSync(localDbPath)) {
  console.log(`Backing up local database to ${localDbBackupPath}...`);
  fs.copyFileSync(localDbPath, localDbBackupPath);
  console.log('Local backup complete.');
}

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection established for DB download.');
  
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP Error:', err);
      conn.end();
      return;
    }
    
    console.log(`Downloading remote database from ${remoteDbPath} to ${localDbPath}...`);
    
    const readStream = sftp.createReadStream(remoteDbPath);
    const writeStream = fs.createWriteStream(localDbPath);
    
    writeStream.on('close', () => {
      console.log('Database download and overwrite complete!');
      conn.end();
    });
    
    writeStream.on('error', (err) => {
      console.error('Write Stream Error:', err);
      conn.end();
    });
    
    readStream.on('error', (err) => {
      console.error('Read Stream Error:', err);
      conn.end();
    });
    
    readStream.pipe(writeStream);
  });
}).on('error', (err) => {
  console.error('SSH Client Error:', err);
}).connect(config);
