const fs = require("fs")
const rows = JSON.parse(fs.readFileSync("import_cat1.json", "utf8"))
const q = (v) => "'" + String(v).replace(/'/g, "''") + "'"
const sql = [
  "DELETE FROM cart_items WHERE product_id IN (SELECT id FROM products WHERE category_id = 1);",
  "DELETE FROM favorites WHERE product_id IN (SELECT id FROM products WHERE category_id = 1);",
  "DELETE FROM skus WHERE product_id IN (SELECT id FROM products WHERE category_id = 1);",
  "DELETE FROM products WHERE category_id = 1;",
]
for (const r of rows) {
  const base = "https://api.qg.elinew.tech"
  sql.push(
    `INSERT INTO products (id, category_id, name, brief, price, original_price, stock, tags, attributes, group_name, pic, images) VALUES ` +
    `(${r.id}, 1, ${q(r.name)}, ${q(r.brief)}, ${r.price}, ${r.ori}, ${r.stock}, ${q(JSON.stringify(r.tags))}, ${q("{}")}, ${q("数码好物")}, ` +
    `${q(base + r.images[0])}, ${q(JSON.stringify(r.images.map((u) => base + u)))});`,
  )
  sql.push(
    `INSERT INTO skus (id, product_id, name, properties, price, stock) VALUES ` +
    `(${r.id * 10 + 1}, ${r.id}, ${q("标准版")}, ${q("规格:标准版")}, ${r.price}, ${r.stock});`,
  )
}
fs.writeFileSync("import_cat1.sql", sql.join("\n") + "\n")
console.log("regenerated", sql.length, "statements")
