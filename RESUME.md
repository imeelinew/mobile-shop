## Token 存储

`TOKEN_KEY = 'token'` 固定是正常的，它只是 localStorage 的存储名称；真正的 Token 值由后端在登录成功后动态返回。学习项目这样写没问题，安全要求高的项目通常使用 HttpOnly Cookie。
