const fetch = require('node-fetch'); // wait, Node 18+ has fetch natively

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/procurement/list');
    const data = await res.text();
    console.log("RESPONSE:", data);
  } catch (e) {
    console.error(e);
  }
}
test();
