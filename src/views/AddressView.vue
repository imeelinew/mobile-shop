<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAddressList } from '@/api/order'
import {
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getAreaList,
} from '@/api/address'
import { showConfirmDialog, showFailToast, showSuccessToast, showToast } from 'vant'
import 'vant/es/toast/style'
import 'vant/es/dialog/style'

const router = useRouter()
const route = useRoute()

const mode = ref<'list' | 'add' | 'edit'>('list')
const manageMode = ref(false)
// 订单确认 / 购物车进来：点选地址后设为默认并返回，确认页会读最新默认地址
const isSelectMode = computed(() => {
    const from = String(route.query.from || '')
    return from === 'order' || from === 'cart'
})
const listTitle = computed(() => (isSelectMode.value ? '选择收货地址' : '地址列表'))
const addressList = ref<any[]>([])
const chosenAddressId = ref<number>()
const editingAddrId = ref<number>()
const editingAddress = ref<any>(null)

const receiver = ref('')
const mobile = ref('')
const addr = ref('')

const showAreaCascader = ref(false)
const areaOptions = ref<any[]>([])
const areaCascaderValue = ref<number>()
const areaLoading = ref(false)
const areaText = ref('')
const provinceId = ref<number>()
const cityId = ref<number>()
const areaIdValue = ref<number>()
const provinceName = ref('')
const cityName = ref('')
const areaName = ref('')

function formatAddressList(list: any[]) {
    return list.map((item) => ({
        ...item,
        id: item.addrId,
        name: item.receiver,
        tel: item.mobile,
        address: item.province + item.city + item.area + item.addr,
        isDefault: Number(item.commonAddr) === 1,
    }))
}

async function loadList() {
    const res = await getAddressList()
    addressList.value = formatAddressList(res.data || [])
    const defaultItem = addressList.value.find((item) => item.isDefault)
        || addressList.value[0]
    chosenAddressId.value = defaultItem?.id
}

function resetForm() {
    receiver.value = ''
    mobile.value = ''
    addr.value = ''
    areaText.value = ''
    provinceId.value = undefined
    cityId.value = undefined
    areaIdValue.value = undefined
    provinceName.value = ''
    cityName.value = ''
    areaName.value = ''
    areaCascaderValue.value = undefined
    areaOptions.value = []
    editingAddrId.value = undefined
    editingAddress.value = null
}

function openAdd() {
    resetForm()
    manageMode.value = false
    mode.value = 'add'
}

function openEdit(item: any) {
    // 保存当前编辑的完整地址，删除/判断默认都用这份，避免再按 id find 找错
    editingAddress.value = item
    editingAddrId.value = Number(item.addrId ?? item.id)
    receiver.value = item.receiver || item.name || ''
    mobile.value = item.mobile || item.tel || ''
    addr.value = item.addr || ''
    provinceId.value = item.provinceId
    cityId.value = item.cityId
    areaIdValue.value = item.areaId
    provinceName.value = item.province || ''
    cityName.value = item.city || ''
    areaName.value = item.area || ''
    areaText.value = item.province && item.city && item.area
        ? `${item.province}/${item.city}/${item.area}`
        : ''
    manageMode.value = false
    mode.value = 'edit'
}

function backToList() {
    mode.value = 'list'
    resetForm()
    loadList()
}

function goBack() {
    if (mode.value !== 'list') {
        backToList()
        return
    }
    router.back()
}

function toggleManageMode() {
    if (isSelectMode.value) return
    manageMode.value = !manageMode.value
}

const openAreaCascader = async () => {
    try {
        const res = await getAreaList(0)
        areaOptions.value = res.data.map((item: any) => ({
            text: item.areaName,
            value: item.areaId,
            children: [],
        }))
        showAreaCascader.value = true
    } catch (error) {
        console.log(error, 'error获取省份列表')
        showFailToast('地区加载失败，请重试')
    }
}

const onCascaderChange = async ({ selectedOptions }: any) => {
    const current = selectedOptions[selectedOptions.length - 1]
    areaLoading.value = true
    try {
        const res = await getAreaList(current.value)
        const isLastLevel = selectedOptions.length === 2
        current.children = res.data.map((item: any) =>
            isLastLevel
                ? { text: item.areaName, value: item.areaId }
                : { text: item.areaName, value: item.areaId, children: [] }
        )
    } catch (error) {
        console.log(error, 'error获取下级地区')
        showFailToast('地区加载失败，请重试')
    } finally {
        areaLoading.value = false
    }
}

const onCascaderFinish = ({ selectedOptions }: any) => {
    areaText.value = selectedOptions.map((item: any) => item.text).join('/')
    provinceId.value = selectedOptions[0].value
    provinceName.value = selectedOptions[0].text
    cityId.value = selectedOptions[1].value
    cityName.value = selectedOptions[1].text
    areaIdValue.value = selectedOptions[2].value
    areaName.value = selectedOptions[2].text
    showAreaCascader.value = false
}

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
    if (!receiver.value || !mobile.value || !addr.value || !areaIdValue.value) {
        showToast('请填写完整地址信息')
        return
    }

    try {
        const payload = buildPayload()
        const res = mode.value === 'edit'
            ? await updateAddress({ ...payload, addrId: editingAddrId.value })
            : await addAddress(payload)

        if (res.success) {
            showSuccessToast(mode.value === 'edit' ? '修改地址成功' : '新增地址成功')
            backToList()
        } else {
            showFailToast(res.msg || '保存失败')
        }
    } catch (error) {
        console.log(error, 'error保存地址')
        showFailToast('保存失败')
    }
}

async function handleSetDefault(item: any, options: { silentIfSame?: boolean } = {}) {
    const addrId = Number(item?.addrId ?? item?.id)
    if (!addrId) return false
    if (item.isDefault || Number(item.commonAddr) === 1) {
        if (!options.silentIfSame) {
            showToast('已是默认地址')
        }
        return true
    }

    try {
        const res = await setDefaultAddress(addrId)
        if (res.success) {
            showSuccessToast('设置默认地址成功')
            manageMode.value = false
            await loadList()
            return true
        }
        showFailToast(res.msg || '设置失败')
        return false
    } catch (error) {
        console.log(error, 'error设置默认地址')
        showFailToast('设置失败')
        return false
    }
}

// 管理模式：点选设为默认；从订单/购物车进入：点选后设默认并返回
async function handleSelect(item: any) {
    if (!item) return
    chosenAddressId.value = item.id

    if (manageMode.value) {
        await handleSetDefault(item)
        return
    }

    if (isSelectMode.value) {
        const ok = await handleSetDefault(item, { silentIfSame: true })
        if (ok) {
            router.back()
        }
    }
}

async function handleDelete() {
    const target = editingAddress.value
    const addrId = Number(target?.addrId ?? target?.id ?? editingAddrId.value)

    if (!addrId) {
        showFailToast('地址信息异常')
        return
    }

    // 只拦截「当前这条」本身是默认地址的情况
    // 不要再 addressList.find，避免 id 异常时误命中第一条默认地址
    const isDefaultTarget = target?.isDefault || Number(target?.commonAddr) === 1
    if (isDefaultTarget) {
        showToast('请先更换默认地址')
        return
    }

    // 再和列表里带「默认」标记的那条比对一次
    const defaultItem = addressList.value.find((item) => item.isDefault)
    if (defaultItem && Number(defaultItem.addrId ?? defaultItem.id) === addrId) {
        showToast('请先更换默认地址')
        return
    }

    try {
        await showConfirmDialog({ title: '提示', message: '确认删除该地址吗？' })
        const res = await deleteAddress(addrId)
        if (res.success) {
            showSuccessToast('删除地址成功')
            backToList()
        } else {
            showFailToast(res.msg || '删除失败')
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.log(error, 'error删除地址')
            showFailToast('删除失败')
        }
    }
}

onMounted(() => {
    loadList()
})
</script>

<template>
    <div class="address-view">
        <div v-if="mode === 'list'" class="list-mode">
            <van-nav-bar
                :title="listTitle"
                left-text="返回"
                :right-text="isSelectMode ? '' : (manageMode ? '完成' : '管理')"
                left-arrow
                @click-left="goBack"
                @click-right="toggleManageMode"
            />

            <van-address-list
                v-model="chosenAddressId"
                :list="addressList"
                default-tag-text="默认"
                add-button-text="新增地址"
                @add="openAdd"
                @edit="(item) => openEdit(item)"
                @select="handleSelect"
            >
                <template #item-bottom="address">
                    <div v-if="manageMode" class="manage-row" @click.stop>
                        <span
                            class="set-default"
                            :class="{ active: address.isDefault }"
                            @click="handleSetDefault(address)"
                        >
                            {{ address.isDefault ? '当前默认地址' : '设为默认地址' }}
                        </span>
                    </div>
                </template>
            </van-address-list>
        </div>

        <div v-else class="form-mode">
            <van-nav-bar
                :title="mode === 'add' ? '新增地址' : '编辑地址'"
                left-text="返回"
                left-arrow
                @click-left="backToList"
            />

            <div class="form-card">
                <van-field v-model="receiver" label="姓名" placeholder="姓名" />
                <van-field v-model="mobile" label="电话" placeholder="电话" type="tel" />
                <van-field
                    v-model="areaText"
                    label="地区"
                    placeholder="地区"
                    readonly
                    is-link
                    @click="openAreaCascader"
                />
                <van-field v-model="addr" label="详细地址" placeholder="详细地址" />
            </div>

            <div class="form-actions">
                <van-button type="danger" round block @click="handleSave">保存</van-button>
                <van-button
                    v-if="mode === 'edit'"
                    type="danger"
                    round
                    block
                    class="delete-btn"
                    @click="handleDelete"
                >
                    删除
                </van-button>
            </div>
        </div>

        <van-popup v-model:show="showAreaCascader" position="bottom" round>
            <van-cascader
                v-model="areaCascaderValue"
                title="请选择地区"
                :options="areaOptions"
                @change="onCascaderChange"
                @finish="onCascaderFinish"
                @close="showAreaCascader = false"
            >
                <template #options-top>
                    <van-loading v-if="areaLoading" class="area-loading" size="24px">加载中...</van-loading>
                </template>
            </van-cascader>
        </van-popup>
    </div>
</template>

<style lang="scss" scoped>
.address-view {
    min-height: 100vh;
    background: var(--shop-bg);
}

.list-mode {
    :deep(.van-address-list) {
        padding-bottom: 100px;
    }

    :deep(.van-address-item) {
        margin: 16px 20px 0;
        border-radius: var(--shop-radius);
        overflow: hidden;
    }

    :deep(.van-address-item__tag) {
        background: var(--shop-primary);
        border-color: var(--shop-primary);
    }

    :deep(.van-radio__icon--checked .van-icon) {
        background-color: var(--shop-primary);
        border-color: var(--shop-primary);
    }

    :deep(.van-address-list__bottom) {
        padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
    }

    :deep(.van-address-list__add) {
        height: 80px;
        border: none;
        border-radius: 999px;
        background: var(--shop-primary);
        color: #fff;
        font-size: 30px;
        font-weight: 600;
    }
}

.manage-row {
    padding: 12px 0 4px;
}

.set-default {
    font-size: 24px;
    color: var(--shop-text-secondary);

    &.active {
        color: var(--shop-primary);
    }
}

.form-card {
    margin: 16px 20px 0;
    overflow: hidden;
    border-radius: var(--shop-radius);
    background: var(--shop-card);
}

.form-actions {
    padding: 40px 40px 0;

    .delete-btn {
        margin-top: 24px;
    }
}

.area-loading {
    justify-content: center;
    padding: 24px 0;
}
</style>
