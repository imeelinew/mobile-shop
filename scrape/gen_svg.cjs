const fs = require("fs")
const lines = fs.readFileSync("/tmp/rest_products.tsv", "utf8").trim().split("\n")
const style = { 2: ["#d94f83", "#ff9bbb", "BEAUTY"], 3: ["#087f5b", "#52c997", "SPORT"], 4: ["#d97706", "#ffc15a", "FRESH"] }
for (const line of lines) {
  const m = line.match(/^(\d+)(.*?)(\d+\.\d{2})$/)
  if (!m) { console.error("unparsed:", line.slice(0, 40)); continue }
  const [, id, name, price] = m
  const catId = +id >= 207 ? (+id >= 213 ? 4 : 3) : 2
  const s = style[catId]
  const title = name.length > 14 ? name.slice(0, 14) + "…" : name
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${s[0]}"/><stop offset="1" stop-color="${s[1]}"/></linearGradient></defs><rect width="720" height="720" rx="56" fill="url(#g)"/><circle cx="570" cy="150" r="130" fill="white" opacity=".1"/><circle cx="120" cy="640" r="180" fill="white" opacity=".08"/><text x="64" y="96" fill="white" opacity=".78" font-family="Arial,sans-serif" font-size="26" letter-spacing="8">${s[2]}</text><text x="64" y="520" fill="white" font-family="Arial,'PingFang SC',sans-serif" font-size="42" font-weight="700">${title}</text><text x="64" y="590" fill="white" opacity=".88" font-family="Arial,'PingFang SC',sans-serif" font-size="28">¥${Number(price).toFixed(0)} · 轻购精选</text></svg>`
  fs.writeFileSync(`staging/media/products/${id}.svg`, svg)
}
console.log("svgs:", fs.readdirSync("staging/media/products").filter(f => f.endsWith(".svg")).length)
