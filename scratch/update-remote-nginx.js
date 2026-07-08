const { Client } = require('ssh2');

const config = {
  host: '65.20.105.127',
  port: 22,
  username: 'root',
  password: 'i3C?bfh%xE(2cD5r'
};

const newNginxConfig = `
server {
    listen 80;
    listen [::]:80;
    server_name igoriptv2.com www.igoriptv2.com;

    # Redirect all HTTP requests to HTTPS non-www
    return 301 https://igoriptv2.com$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name www.igoriptv2.com;

    ssl_certificate /etc/letsencrypt/live/igoriptv2.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/igoriptv2.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Redirect HTTPS www to HTTPS non-www
    return 301 https://igoriptv2.com$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name igoriptv2.com;

    ssl_certificate /etc/letsencrypt/live/igoriptv2.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/igoriptv2.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

const conn = new Client();

function executeCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      
      let out = '';
      let errOut = '';
      stream.on('close', (code) => {
        resolve({ code, out, errOut });
      }).on('data', (data) => {
        out += data.toString();
      }).stderr.on('data', (data) => {
        errOut += data.toString();
      });
    });
  });
}

function uploadStringToFile(conn, str, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on('close', () => {
        resolve();
      });
      writeStream.on('error', (err) => {
        reject(err);
      });
      writeStream.end(str);
    });
  });
}

conn.on('ready', async () => {
  console.log('SSH connection established to update Nginx configuration...');
  
  try {
    const nginxConfigPath = '/etc/nginx/sites-enabled/igortv';
    const backupPath = '/etc/nginx/sites-available/igortv.bak';

    // 1. Back up the existing config
    console.log(`Backing up remote config to ${backupPath}...`);
    const backupResult = await executeCommand(conn, `cp ${nginxConfigPath} ${backupPath}`);
    if (backupResult.code !== 0) {
      console.warn('Backup failed, config might not exist yet. Continuing...', backupResult.errOut);
    } else {
      console.log('Backup created successfully.');
    }

    // 2. Upload the new Nginx config
    console.log('Uploading new Nginx config...');
    await uploadStringToFile(conn, newNginxConfig, nginxConfigPath);

    // 3. Test the Nginx config
    console.log('Testing Nginx configuration syntax...');
    const testResult = await executeCommand(conn, 'nginx -t');
    console.log(testResult.out || testResult.errOut);
    
    if (testResult.code !== 0) {
      console.error('Nginx syntax test failed! Restoring backup...');
      if (backupResult.code === 0) {
        await executeCommand(conn, `cp ${backupPath} ${nginxConfigPath}`);
        console.log('Backup restored successfully.');
      }
      throw new Error('Nginx syntax check failed.');
    }
    console.log('Nginx syntax test passed!');

    // 4. Reload Nginx
    console.log('Reloading Nginx service...');
    const reloadResult = await executeCommand(conn, 'systemctl reload nginx');
    if (reloadResult.code !== 0) {
      console.error('Failed to reload Nginx! Restoring backup...');
      if (backupResult.code === 0) {
        await executeCommand(conn, `cp ${backupPath} ${nginxConfigPath}`);
        await executeCommand(conn, 'systemctl reload nginx');
        console.log('Backup restored and Nginx reloaded.');
      }
      throw new Error('Failed to reload Nginx.');
    }
    console.log('Nginx reloaded successfully!');
    console.log('\n=========================================');
    console.log('NGINX REDIRECTS CONFIGURATION COMPLETED!');
    console.log('=========================================');

  } catch (error) {
    console.error('Nginx update process failed:', error.message);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect(config);
