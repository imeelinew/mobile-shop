# 移动商城全栈运行与演示

本文档对应当前 `mobile-shop` 前端和同级 `mobile-shop-api` 后端的订单链路。支付适配器目前为 `mock`，页面也会明确标注“模拟支付”，不会产生真实扣款。

## 本地启动

后端需要 PostgreSQL。主验收环境应提供真实的 `DATABASE_URL` 和 `JWT_SECRET`，然后启动 `mobile-shop-api`：

```bash
cd /Users/eli/Dev/mobile-shop-api
npm install
npm run dev
```

后端默认监听 `http://127.0.0.1:3000`。数据库迁移和种子数据由后端启动流程执行；数据库密码等敏感值只放在后端自己的环境中。

前端默认通过同源 `/api` 请求后端，避免开发端口变化导致 CORS 问题：

```bash
cd /Users/eli/Dev/mobile-shop
npm install
npm run dev
```

环境配置规则：

- 未设置 `VITE_APP_URL` 时，前端使用同源 `/api`。
- Vite 会把同源 `/api` 代理到后端。代理默认目标为 `http://127.0.0.1:3000`，可用进程环境变量 `VITE_API_PROXY_TARGET` 覆盖。
- `VITE_APP_URL` 可设置完整 API 地址，进程环境变量优先级高于已有本地配置；超出当前工作范围时不需要修改 `.env` 文件。
- 仓库现有 `.env*` 文件不做自动改写。

例如临时连接另一台开发机：

```bash
VITE_APP_URL=http://192.168.1.20:3000 npm run dev
```

## 演示流程

1. 使用登录页展示的演示账号登录。
2. 将商品加入购物车，选择地址并进入订单确认页。
3. 点击“提交订单”。前端会为当前提交内容持久化一个 `Idempotency-Key`；请求失败后重试会复用同一 key，创建成功后清除。
4. 支付确认框会明确说明这是模拟支付。取消支付时，订单保留在“待付款”；支付成功后进入“待发货”。
5. “待付款”中的订单可以取消。取消成功后后端恢复库存，并进入“已取消”tab。
6. 管理员将订单标记发货后，订单进入“待收货”；用户确认收货后进入“已完成”。
7. 待付款订单超过后端 `ORDER_PAYMENT_TIMEOUT_MINUTES`（默认 30 分钟）后会由服务端判定超时并回补库存。

管理员权限来自数据库，不能通过前端伪造。先在一个已完成注册的账号上设置角色：

```sql
UPDATE users SET role = 'admin' WHERE username = 'your-admin-username';
```

该账号重新登录后，个人页会显示“管理员发货”入口。页面允许输入订单号执行发货，后端 `requireAdmin` 会按 JWT 中的用户 ID 实时查询数据库角色，并以服务端校验结果为准。

## 订单契约

订单状态：

| 状态 | 含义 |
| --- | --- |
| `1` | 待付款 |
| `2` | 待发货 |
| `3` | 待收货 |
| `5` | 已完成 |
| `6` | 已取消 |

主要接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/me` | 当前用户 `userId`、`username`、`role` |
| `POST` | `/p/order/submit` | 提交订单，必须带 `Idempotency-Key` |
| `POST` | `/p/order/pay` | 模拟支付，返回服务端 payment provider |
| `POST` | `/p/order/cancel` | 用户取消待付款订单并回补库存 |
| `PUT` | `/p/myOrder/receipt/:orderNumber` | 用户确认收货 |
| `GET` | `/p/myOrder/myOrder` | 按 `1/2/3/5/6` 查询当前用户订单 |
| `POST` | `/admin/orders/:orderNumber/ship` | 管理员发货 |
| `POST` | `/ai/chat` | 需要 Bearer token 的 AI 代理 |

注册规则与后端一致：用户名为 3 到 16 位数字、字母或下划线；密码长度为 8 到 72 位。登录密码长度为 1 到 72 位。

AI 请求会携带当前登录 token。返回 `401` 时，前端会清除本地 token 并跳转登录页；普通网络或 AI 服务错误会降级到本地搜索建议。

## 自动验证

```bash
npm run build
npm run test:e2e
```

`test:e2e` 使用 Playwright 和 API mock，验证个人页用户名、取消/模拟支付/收货操作、结算幂等键复用与清除、Storage 不可用时的内存兜底、下单成功后模拟支付失败不能重复提交、管理员发货请求以及 AI 鉴权失效跳转。它不替代真实 PostgreSQL 联调；主验收仍需连接真实后端执行完整下单、库存回补和权限流程。

另有真实端到端验收 `npm run test:e2e:live`，不拦截或替换 API。运行前启动本机 3000 端口后端、初始化独立演示数据库，并将一个演示账号提升为管理员。测试会注册独立用户、准备地址，从商品详情页实际购买，再操作取消、模拟支付、管理员发货和收货。管理员账号可通过 `E2E_ADMIN_USERNAME` 与 `E2E_ADMIN_PASSWORD` 指定；默认使用登录页已有演示账号，因此需先在独立演示库运行后端的 `admin:promote -- zhangsan123`。不要对生产库运行该测试。测试完成订单会保留在演示库中，便于复查，不进行宽泛的数据清理。

浏览器验收前端运行在 `http://127.0.0.1:4173`，请将它加入后端 `ALLOWED_ORIGIN`。API 地址可用 `E2E_API_URL` 覆盖；前端代理目标需同步设置 `VITE_API_PROXY_TARGET`。此测试证明主链路联调，不能代替后端的并发和事务回滚集成测试。
