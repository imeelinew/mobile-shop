## Token 存储

`TOKEN_KEY = 'token'` 固定是正常的，它只是 localStorage 的存储名称；真正的 Token 值由后端在登录成功后动态返回。学习项目这样写没问题，安全要求高的项目通常使用 HttpOnly Cookie。

## Token 过期处理

在 Axios 响应拦截器中统一判断后端业务码 `A00004`，同时兼容 HTTP 401；Token 失效后清除本地 Token，保存当前地址并跳转登录页，重新登录后可返回原页面。
