<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerApi } from '@/api/userInfo'
import { encryptPassword } from '@/utils/encrypt'
import { showSuccessToast, showFailToast } from 'vant'

// 群里发的函数组件样式
import 'vant/es/toast/style'
const router = useRouter()
// 表单验证
const username = ref('')
const password = ref('')
const onRegister = async (values) => {
    try {
        const result = await registerApi({
            userName: values.username,
            passWord: encryptPassword(values.password),
        })

        if (result.success) {
            showSuccessToast('注册成功')

            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } else {
            showFailToast(result.msg || '注册失败')
        }
    } catch (error) {
        console.error('注册失败', error)
        showFailToast('网络请求失败')
    }
}
const goBack = () => {
    router.back()
}
// 正则
const usernameValidator = (value) => {
    return /^\w{3,16}$/.test(value)
}

const passwordValidator = (value) => {
    return /^\d{6,16}$/.test(value)
}
</script>
<template>
    <van-nav-bar title="注册" left-text="返回" left-arrow @click-left="goBack" />
    <div>
        <h1>创建账号</h1>
    </div>
    <!-- 表单 -->
    <van-form @submit="onRegister">
        <van-cell-group inset>
            <van-field v-model="username" name="username" label="用户名" placeholder="用户名" :rules="[{ required: true, message: '请填写用户名' }, {
                validator: usernameValidator,
                message: '用户名必须是3到16位数字、字母或下划线'
            }]" />
            <van-field v-model="password" type="password" name="password" label="密码" placeholder="密码" :rules="[{ required: true, message: '请填写密码' }, {
                validator: passwordValidator,
                message: '密码必须是6到16位数字'
            }]" />
        </van-cell-group>
        <div class="submit-box">
            <van-button round block type="primary" native-type="submit">
                创建账号
            </van-button>
        </div>
    </van-form>
</template>
<style lang="scss" scoped>
.submit-box {
    margin: 16px;
}
</style>
