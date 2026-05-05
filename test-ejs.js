const ejs = require('ejs');
const fs = require('fs');

const views = fs.readdirSync('views').filter(f => f.endsWith('.ejs'));
for (const view of views) {
    try {
        const template = fs.readFileSync('views/' + view, 'utf-8');
        ejs.compile(template);
        console.log(view + " OK");
    } catch(e) {
        console.error(view + " ERROR:", e.message);
    }
}
