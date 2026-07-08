const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
  console.log('SSH connection established to fix Nginx backups...');
  c.exec('mv /etc/nginx/sites-enabled/igortv.bak /etc/nginx/sites-available/igortv.bak && nginx -t && systemctl reload nginx', (err, s) => {
    s.on('close', () => c.end())
     .on('data', d => process.stdout.write(d.toString()))
     .stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect({
  host: '65.20.105.127',
  port: 22,
  username: 'root',
  password: 'i3C?bfh%xE(2cD5r'
});
