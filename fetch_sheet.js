const https = require('https');
const fs = require('fs');

const sheetId = '1_zD_fr01PiAwEJlb-LOxJh25_og5GP2kvzUdLJWicNM';
const gid = '965136516';
const url = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/export?format=csv&gid=' + gid;

function get(u) {
  https.get(u, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to:', res.headers.location);
      get(res.headers.location);
      return;
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Length:', data.length);
      console.log('First 500 chars:\n', data.slice(0, 500));
      fs.writeFileSync('sheet_data.csv', data);
    });
  }).on('error', err => console.error(err));
}

get(url);
