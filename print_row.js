import fs from 'fs';
if (fs.existsSync('row_out.html')) {
  const c = fs.readFileSync('row_out.html', 'utf8');
  const start = c.indexOf('<div id="output">');
  const end = c.indexOf('</div>', start);
  console.log(c.slice(start + '<div id="output">'.length, end));
}

