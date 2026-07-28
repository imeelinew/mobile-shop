<script lang="ts" setup>
import { getAddressList } from '@/api/order';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { addAddress, getAreaList } from '@/api/address';
import { showSuccessToast, showFailToast } from 'vant';
import 'vant/es/toast/style';
const router = useRouter();

//三种模式切换，展示，添加，编辑
const mode = ref<'list' | 'add' | 'edit'>('list');

const addressList = ref<any[]>([]);
//三个表单value
const receiver = ref('');
const mobile = ref('');
const addr = ref('');

//级联选择器
const showAreaCascader = ref(false)
const areaOptions = ref<any[]>([])
const areaCascaderValue = ref<number>()
const areaLoading = ref(false)

const openAreaCascader = async () => {
    try {
        const res = await getAreaList(0)
        areaOptions.value = res.data.map((item: any) => ({
            text: item.areaName,
            value: item.areaId,
            children: [], // 有children字段(哪怕是空的)，告诉组件"后面还有下一层，先别结束选择"
        }))
        showAreaCascader.value = true
    } catch (error) {
        console.log(error, 'error获取省份列表')
        showFailToast('地区加载失败，请重试')
    }
}
const areaText = ref('')
const provinceId = ref<number>()
const cityId = ref<number>()
const areaIdValue = ref<number>()
const provinceName = ref('')
const cityName = ref('')
const areaName = ref('')

//用户选中一层后，问后端要下一层数据，挂到这一层的children上
const onCascaderChange = async ({ selectedOptions }: any) => {
    const current = selectedOptions[selectedOptions.length - 1]
    areaLoading.value = true
    try {
        const res = await getAreaList(current.value)
        const isLastLevel = selectedOptions.length === 2 // 选完市，取的是区，区是最后一层，不能带children
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

//省市区三层全部选完，触发这个
const onCascaderFinish = ({ selectedOptions }: any) => {
    areaText.value = selectedOptions.map((item: any) => item.text).join('')
    provinceId.value = selectedOptions[0].value
    provinceName.value = selectedOptions[0].text
    cityId.value = selectedOptions[1].value
    cityName.value = selectedOptions[1].text
    areaIdValue.value = selectedOptions[2].value
    areaName.value = selectedOptions[2].text
    showAreaCascader.value = false
}
//添加地址
const handleAddAddress = async () => {
    try {
        const res = await addAddress({
            receiver: receiver.value,
            mobile: mobile.value,
            addr: addr.value,
            province: provinceName.value,
            provinceId: provinceId.value,
            city: cityName.value,
            cityId: cityId.value,
            area: areaName.value,
            areaId: areaIdValue.value,
        })

        if (res.success) {
            showSuccessToast('新增地址成功')
            const listRes = await getAddressList()
            addressList.value = listRes.data || []
            mode.value = 'list'
        } else {
            showFailToast(res.msg || '新增地址失败')
        }
    } catch (error) {
        console.log(error, 'error添加地址')
        showFailToast('新增地址失败')
    }
}
onMounted(async () => {
    const res = await getAddressList()
    addressList.value = res.data || []
})
</script>
<template>
    <div class="address-view">
        <div v-if="mode === 'list'">
            <van-nav-bar title="地址管理" left-text="返回" right-text="管理" left-arrow @click-left="mode = 'list'"
                @click-right="" />
            <div v-for="item in addressList" :key="item.addrId">
                <p>{{ item.receiver }} {{ item.mobile }}</p>
                <p>{{ item.province }}{{ item.city }}{{ item.area }}{{ item.addr }}</p>
                <span v-if="item.commonAddr === 1">默认</span>
            </div>
            <van-action-bar>
                <van-action-bar-button type="danger" text="新增地址" @click="mode = 'add'" />
            </van-action-bar>
        </div>
        <div v-else-if="mode === 'add'">
            <van-nav-bar title="添加地址" left-text="返回" left-arrow @click-left="mode = 'list'" />
            <van-field v-model="receiver" label="收件人" placeholder="请输入收件人姓名" />
            <van-field v-model="areaText" label="地区" placeholder="请选择地区" readonly is-link @click="openAreaCascader" />
            <van-popup v-model:show="showAreaCascader" position="bottom" round>
                <van-cascader v-model="areaCascaderValue" title="请选择地区" :options="areaOptions"
                    @change="onCascaderChange" @finish="onCascaderFinish" @close="showAreaCascader = false">
                    <template #options-top>
                        <van-loading v-if="areaLoading" class="area-loading" size="24px">加载中...</van-loading>
                    </template>
                </van-cascader>
            </van-popup>
            <van-field v-model="mobile" label="手机号" placeholder="请输入手机号" />
            <van-field v-model="addr" label="详细地址" placeholder="请输入详细地址" />
            <van-button type="danger" block @click="handleAddAddress">保存</van-button>
        </div>
        <div v-else-if="mode === 'edit'">
            <van-nav-bar title="编辑地址" left-text="返回" left-arrow @click-left="mode = 'list'" />
        </div>
    </div>

</template>
<style lang="scss" scoped>
.area-loading {
    justify-content: center;
    padding: 24px 0;
}
</style>
