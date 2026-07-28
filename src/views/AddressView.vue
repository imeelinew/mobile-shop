<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
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

const mode = ref<'list' | 'add' | 'edit'>('list')
const manageMode = ref(false)
const addressList = ref<any[]>([])
const chosenAddressId = ref<number>()
const editingAddrId = ref<number>()

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
        isDefault: item.commonAddr === 1,
    }))
}

async function loadList() {
    const res = await getAddressList()
    addressList.value = formatAddressList(res.data || [])
    const defaultItem = addressList.value.find((item) => item.commonAddr === 1)
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
}

function openAdd() {
    resetForm()
    manageMode.value = false
    mode.value = 'add'
}

function openEdit(item: any) {
    editingAddrId.value = item.addrId
    receiver.value = item.receiver
    mobile.value = item.mobile
    addr.value = item.addr
    provinceId.value = item.provinceId
    cityId.value = item.cityId
    areaIdValue.value = item.areaId
    provinceName.value = item.province
    cityName.value = item.city
    areaName.value = item.area
    areaText.value = `${item.province}/${item.city}/${item.area}`
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

async function handleSetDefault(item: any) {
    try {
        const res = await setDefaultAddress(item.addrId)
        if (res.success) {
            showSuccessToast('设置默认地址成功')
            manageMode.value = false
            await loadList()
        } else {
            showFailToast(res.msg || '设置失败')
        }
    } catch (error) {
        console.log(error, 'error设置默认地址')
        showFailToast('设置失败')
    }
}

async function handleDelete() {
    if (!editingAddrId.value) return

    const current = addressList.value.find((item) => item.addrId === editingAddrId.value)
    if (current?.commonAddr === 1) {
        showToast('请先更换默认地址')
        return
    }

    try {
        await showConfirmDialog({ title: '提示', message: '确认删除该地址吗？' })
        const res = await deleteAddress(editingAddrId.value)
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
                title="地址列表"
                left-text="返回"
                :right-text="manageMode ? '完成' : '管理'"
                left-arrow
                @click-left="goBack"
                @click-right="manageMode = !manageMode"
            />

            <van-address-list
                v-model="chosenAddressId"
                :list="addressList"
                default-tag-text="默认"
                add-button-text="新增地址"
                @add="openAdd"
                @edit="openEdit"
            >
                <template v-if="manageMode" #item-bottom="{ item }">
                    <div class="manage-row" @click.stop>
                        <span
                            class="set-default"
                            :class="{ active: item.isDefault }"
                            @click="handleSetDefault(item)"
                        >
                            {{ item.isDefault ? '当前默认地址' : '设为默认地址' }}
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

    :deep(.van-tag--danger) {
        background: var(--shop-primary);
    }

    :deep(.van-radio__icon--checked .van-icon) {
        background-color: var(--shop-primary);
        border-color: var(--shop-primary);
    }

    :deep(.van-address-list__add) {
        left: 20px;
        right: 20px;
        width: auto;
        border-radius: 999px;
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
