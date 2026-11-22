import assert from "node:assert/strict";

const response = await fetch(process.argv[2] ?? "http://localhost:3000");
assert.equal(response.status, 200);
const html = await response.text();
assert.match(html, /<html\b[^>]*\blang="id"/);
assert.match(html, /<h1\b[^>]*>Kalkulator HPP<\/h1>/);
