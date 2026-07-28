<script lang="ts" setup>
import { getAddressList } from '@/api/order';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { addAddress,getAreaList } from '@/api/address';
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

const openAreaCascader = async () => {
    const res = await getAreaList(0)
    areaOptions.value = res.data.map((item: any) => ({
        text: item.areaName,
        value: item.areaId,
    }))
    showAreaCascader.value = true
}
const areaText = ref('')
//添加地址
const handleAddAddress = async () => {
    try {
        const res = await addAddress({
            receiver: receiver.value,
            mobile: mobile.value,
            addr: addr.value,
            //test
            area: 1,
            cityId: 1,
            areaId: 1,
            city: 1,
            province: 1,
            provinceId: 1,

        })
        receiver.value = res.data.receiver;
        mobile.value = res.data.mobile;
        addr.value = res.data.addr;
    } catch (error) {
        console.log(error, 'error添加地址')
    } finally {
        mode.value = 'list';
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
            <van-field v-model="receiver" label="地区" placeholder="请选择地区" @click="openAreaCascader" />
            <van-field v-model="mobile" label="手机号" placeholder="请输入手机号" />
            <van-field v-model="addr" label="详细地址" placeholder="请输入详细地址" />
            <van-button type="danger" block @click="handleAddAddress">保存</van-button>
        </div>
        <div v-else-if="mode === 'edit'">
            <van-nav-bar title="编辑地址" left-text="返回" left-arrow @click-left="mode = 'list'" />
        </div>
    </div>

</template>
<style lang="scss" scoped></style>