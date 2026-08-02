# Day6 详细指南：购物车交互 + 地址管理

假期项目 · 7 月 27 日

这份文档用大白话说明这一天的内容：为什么这么做、数据怎么走、关键代码在哪。代码都来自当前项目，方便对照着看。

---

## 目录

1. [这一天在讲什么](#1-这一天在讲什么)
2. [上午：购物车怎么工作](#2-上午购物车怎么工作)
3. [下午：地址管理总思路](#3-下午地址管理总思路)
4. [默认地址：怎么设、怎么防删错](#4-默认地址怎么设怎么防删错)
5. [新增、编辑：参数怎么拼](#5-新增编辑参数怎么拼)
6. [省市区怎么一层层加载](#6-省市区怎么一层层加载)
7. [和订单确认页怎么串起来](#7-和订单确认页怎么串起来)
8. [相关文件一览](#8-相关文件一览)

---

## 1. 这一天在讲什么

可以分成上下午两块，互相关联：

- **上午**：购物车能勾选、算总价、改数量、删除，最后带着选中商品去结算。
- **下午**：单独做一个地址管理页。购物车、订单确认、「我的」都跳进同一个页面，避免到处重复写增删改。

> 记住一句话：**购物车负责「买哪些货」，地址页负责「货送到哪」**。订单确认页把这俩合在一起展示。

---

## 2. 上午：购物车怎么工作

文件：`src/views/CartView.vue`

### 2.1 为什么要把购物车「拍扁」

后端返回的数据是层层嵌套的：店铺 → 优惠组 → 商品。勾选、算总价时，我们真正关心的是每一个商品。所以先拍成一维数组 `cartItems`，后面操作更简单。

```ts
// 扁平化：把嵌套结构摊平，方便勾选和取 basketId
const cartItems = computed(() => {
  const result = []
  cartList.value.forEach((shop) => {
    shop.shopCartItemDiscounts?.forEach((discount) => {
      discount.shopCartItems?.forEach((item) => {
        result.push(item)
      })
    })
  })
  return result
})
```

### 2.2 勾选和总价

总价**不是**前端自己把单价乘数量加起来。正确做法是：把当前勾选的 `basketId` 数组发给后端，后端算完再返回。

```ts
// 当前勾选了哪些购物车项
const selectedBasketIds = computed(() => {
  return cartItems.value
    .filter((item) => item.checked)
    .map((item) => item.basketId)
})

// 问后端要总价
const getTotalPrice = async () => {
  if (selectedBasketIds.value.length === 0) {
    totalPrice.value = 0
    return
  }
  const res = await getCartTotal(selectedBasketIds.value)
  totalPrice.value = res.data.totalMoney
}

// 勾选一变，就重新算总价
watch(selectedBasketIds, async () => {
  await getTotalPrice()
})
```

### 2.3 全选

全选其实就是：遍历拍平后的商品，把每一项的 `checked` 设成一样。

```ts
const allChecked = computed(() => {
  return cartItems.value.length > 0 &&
    cartItems.value.every((item) => item.checked)
})

const toggleAllChecked = (checked) => {
  cartItems.value.forEach((item) => {
    item.checked = checked
  })
}
```

### 2.4 加减数量

步进器给你的是「新数量」，接口要的往往是「增减了多少」（+1 或 -1）。所以先算出差值 `delta`，再调接口。

```ts
const onStepperChange = (item, newCount) => {
  const delta = newCount - item.prodCount
  changeCartItemCount(item, delta)
}

const changeCartItemCount = async (item, count) => {
  const res = await addCart({
    basketId: item.basketId,
    prodId: item.prodId,
    skuId: item.skuId,
    shopId: item.shopId,
    count, // +1 或 -1
  })
  if (!res.success) return

  const nextCount = item.prodCount + count
  if (nextCount > 0) {
    item.prodCount = nextCount
  } else {
    // 减到 0，就当删除
    handleDeleteCartItem([item.basketId])
  }
  getTotalPrice()
}
```

### 2.5 提交订单前先「暂存」

购物车页把选中商品的 id 和地址 id 放进 `sessionStorage`，再跳到订单确认页。这样刷新确认页也能读到刚才选的东西。

```ts
const handleCheckout = () => {
  if (selectedBasketIds.value.length === 0) {
    showFailToast('请选择商品')
    return
  }
  const orderParams = {
    basketIds: selectedBasketIds.value,
    addrId: defaultAddress.value?.addrId ?? 0, // 0 表示用默认地址
  }
  sessionStorage.setItem('confirmOrder', JSON.stringify(orderParams))
  router.push('/order-confirm')
}
```

---

## 3. 下午：地址管理总思路

文件：`src/views/AddressView.vue`

### 3.1 为什么要独立成一页

订单确认能换地址、购物车能换地址、「我的」也能管地址。如果每个页面各写一套增删改，以后改一处就要改三处。所以做成独立路由 `/address`，大家一起用。

### 3.2 同一页三种状态

用一个变量 `mode` 切换，比多个布尔值更不容易乱：

```ts
// list = 列表，add = 新增，edit = 编辑
const mode = ref<'list' | 'add' | 'edit'>('list')
const manageMode = ref(false) // 是否处于「管理」态（用来设默认）
```

- `list`：看地址列表，右上角有「管理」
- `add`：新增表单，只有保存
- `edit`：编辑表单，有保存和删除

### 3.3 接口字段和页面字段不一样

后端叫 `receiver / mobile / commonAddr`，Vant 地址列表组件要的是 `name / tel / isDefault`。所以拉到列表后，先做一次转换：

```ts
function formatAddressList(list) {
  return list.map((item) => ({
    ...item,                          // 原始字段先保留
    id: item.addrId,                  // 组件用的唯一 id
    name: item.receiver,              // 收件人
    tel: item.mobile,                 // 电话
    address: item.province + item.city + item.area + item.addr,
    isDefault: Number(item.commonAddr) === 1, // 1 才是默认
  }))
}
```

> **注意**：用 `Number(commonAddr) === 1`。后端有时返回数字 `1`，有时返回字符串 `"1"`。写成 `=== 1` 可能判断失败。

### 3.4 相关接口

文件：`src/api/address.ts`

```ts
// 新增
export const addAddress = (data) => post('/p/address/addAddr', data)

// 修改（多带一个 addrId）
export const updateAddress = (data) => put('/p/address/updateAddr', data)

// 删除
export const deleteAddress = (addrId) =>
  del(`/p/address/deleteAddr/${addrId}`)

// 设为默认
export const setDefaultAddress = (addrId) =>
  put(`/p/address/defaultAddr/${addrId}`, {})

// 省市区：传 0 拿省，传省 id 拿市，传市 id 拿区
export const getAreaList = (pid) =>
  get('/p/area/listByPid', { pid })
```

---

## 4. 默认地址：怎么设、怎么防删错

### 4.1 设为默认

右上角点「管理」进入管理态，再点某条地址（或点「设为默认地址」），就调设默认接口。成功后**重新拉一遍列表**，让后端数据当唯一真相，不要只在前端改一个布尔值。

```ts
async function handleSetDefault(item) {
  if (!item?.addrId) return
  if (item.isDefault || Number(item.commonAddr) === 1) {
    showToast('已是默认地址')
    return
  }

  const res = await setDefaultAddress(item.addrId)
  if (res.success) {
    showSuccessToast('设置默认地址成功')
    manageMode.value = false
    await loadList() // 重新请求，保证只有一条是默认
  }
}

// 普通点选：只改选中样式
// 管理态下点选：才会真正设默认
async function handleSelect(item) {
  if (!item) return
  chosenAddressId.value = item.id
  if (manageMode.value) {
    await handleSetDefault(item)
  }
}
```

### 4.2 默认地址不能直接删

如果把默认地址删了，下单时可能找不到收货地址。所以删除前要判断：当前编辑的这条是不是默认。

> **容易踩的坑**：不要删的时候再 `addressList.find(addrId)`。万一 id 对不上，可能误命中列表第一条（常常正好是默认地址），就会出现「明明删第二条，却提示是默认地址」的情况。
>
> **正确做法**：打开编辑时，把整条地址存进 `editingAddress`，删除时用这份快照来判断。

```ts
function openEdit(item) {
  editingAddress.value = item              // 存整份
  editingAddrId.value = Number(item.addrId ?? item.id)
  receiver.value = item.receiver || item.name || ''
  mobile.value = item.mobile || item.tel || ''
  addr.value = item.addr || ''
  // ... 地区字段回显
  mode.value = 'edit'
}

async function handleDelete() {
  const target = editingAddress.value
  const addrId = Number(target?.addrId ?? target?.id)

  // 只看「当前这条」是不是默认
  if (target?.isDefault || Number(target?.commonAddr) === 1) {
    showToast('请先更换默认地址')
    return
  }

  await showConfirmDialog({ title: '提示', message: '确认删除该地址吗？' })
  const res = await deleteAddress(addrId)
  if (res.success) {
    showSuccessToast('删除地址成功')
    backToList()
  }
}
```

---

## 5. 新增、编辑：参数怎么拼

### 5.1 公共参数抽一份

新增和修改字段几乎一样，差别只是修改时多一个 `addrId`。

```ts
function buildPayload() {
  return {
    receiver: receiver.value,
    mobile: mobile.value,
    addr: addr.value,
    province: provinceName.value,
    provinceId: provinceId.value,
    city: cityName.value,
    cityId: cityId.value,
    area: areaName.value,
    areaId: areaIdValue.value,
  }
}

async function handleSave() {
  const payload = buildPayload()
  const res = mode.value === 'edit'
    ? await updateAddress({ ...payload, addrId: editingAddrId.value })
    : await addAddress(payload)

  if (res.success) {
    showSuccessToast(mode.value === 'edit' ? '修改地址成功' : '新增地址成功')
    backToList()
  }
}
```

> 不要在保存时写死 `commonAddr: 0`。否则一改默认地址的内容，默认标记就被清掉了。默认只通过「设为默认」接口去改。

### 5.2 编辑回显：名字要对齐

| 后端字段 | 表单字段 | 含义 |
| --- | --- | --- |
| `receiver` | 姓名 | 收件人 |
| `mobile` | 电话 | 手机号 |
| `province/city/area` | 地区 | 省市区文字 |
| `addr` | 详细地址 | 门牌等 |
| `commonAddr` | — | 1 默认，0 非默认 |

---

## 6. 省市区怎么一层层加载

级联选择器不是一次把全国数据全拉下来，而是：先拿省 → 用户点了某个省，再拿市 → 再拿区。

1. 打开选择器时，请求 `getAreaList(0)`，得到所有省。
2. 用户选中某一层时，用这一层的 `areaId` 再请求下一级，挂到 `children` 上。
3. 选完三层，把名称和 id 都存下来，保存地址时一起提交。

```ts
// 打开时先加载省
const openAreaCascader = async () => {
  const res = await getAreaList(0)
  areaOptions.value = res.data.map((item) => ({
    text: item.areaName,
    value: item.areaId,
    children: [], // 先放空 children，告诉组件后面还有下一层
  }))
  showAreaCascader.value = true
}

// 每选一层，加载下一层
const onCascaderChange = async ({ selectedOptions }) => {
  const current = selectedOptions[selectedOptions.length - 1]
  const res = await getAreaList(current.value)
  const isLastLevel = selectedOptions.length === 2 // 下一层是区，区是最后一层

  current.children = res.data.map((item) =>
    isLastLevel
      ? { text: item.areaName, value: item.areaId }
      : { text: item.areaName, value: item.areaId, children: [] }
  )
}

// 三层选完
const onCascaderFinish = ({ selectedOptions }) => {
  areaText.value = selectedOptions.map((i) => i.text).join('/')
  provinceId.value = selectedOptions[0].value
  provinceName.value = selectedOptions[0].text
  cityId.value = selectedOptions[1].value
  cityName.value = selectedOptions[1].text
  areaIdValue.value = selectedOptions[2].value
  areaName.value = selectedOptions[2].text
  showAreaCascader.value = false
}
```

> 课上也讲过另一种：保存时再按「省名 → 市名 → 区名」去 `find` 出三级 id。我们这里在选择时就拿到了 id，少一次查找，逻辑更直观。

---

## 7. 和订单确认页怎么串起来

文件：`src/views/OrderConfirmView.vue`

流程可以想成这样：

1. 购物车把 `basketIds + addrId` 存进 `sessionStorage`
2. 订单页读出来，再拉一次最新地址列表
3. 用最新的默认地址覆盖 `addrId`（你在地址页换过默认的话，这里会跟上）
4. 再调确认订单接口，展示商品和金额

```ts
const loadOrder = async () => {
  const raw = sessionStorage.getItem('confirmOrder')
  if (!raw) {
    showFailToast('请重新选择商品')
    router.replace('/cart')
    return
  }

  const orderParams = JSON.parse(raw)
  const addressRes = await getAddressList()
  const addressList = addressRes.data || []

  defaultAddress.value =
    addressList.find((item) => Number(item.commonAddr) === 1)
    || addressList[0]
    || null

  // 换过默认地址后，确认订单要用最新的 addrId
  if (defaultAddress.value?.addrId) {
    orderParams.addrId = defaultAddress.value.addrId
    sessionStorage.setItem('confirmOrder', JSON.stringify(orderParams))
  }

  const orderRes = await confirmOrder(orderParams)
  confirmData.value = orderRes.data
}
```

### 入口都在哪

| 页面 | 怎么进地址页 |
| --- | --- |
| 购物车 | 顶部地址那一行 / 「请添加收货地址」 |
| 订单确认 | 点击地址卡片 |
| 我的 | 设置里的「收货地址」 |

```vue
<!-- 我的页 -->
<van-cell
  title="收货地址"
  icon="location-o"
  is-link
  @click="router.push('/address')"
/>
```

---

## 8. 相关文件一览

| 文件 | 干什么的 |
| --- | --- |
| `src/views/CartView.vue` | 购物车：勾选、总价、数量、结算 |
| `src/views/AddressView.vue` | 地址：列表 / 新增 / 编辑 / 默认 / 删除 |
| `src/views/OrderConfirmView.vue` | 订单确认：读暂存参数、展示地址和商品 |
| `src/views/MineView.vue` | 「我的」里进入收货地址 |
| `src/api/address.ts` | 地址和省市区相关接口 |
| `src/api/cart.ts` | 购物车列表、总价、删除接口 |
| `src/api/order.ts` | 地址列表、确认订单、提交订单 |
| `src/router/index.ts` | 注册了 `/address` 和 `/order-confirm` |

> 如果只想抓住主干，按这个顺序读代码就行：
>
> **CartView（怎么结算）→ AddressView（地址怎么管）→ OrderConfirmView（怎么合在一起）→ address.ts（接口长什么样）**
