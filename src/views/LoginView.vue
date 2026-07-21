<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginApi } from '@/api/userInfo'
import { encryptPassword } from '@/utils/encrypt'
import { setToken } from '@/utils/token'
import { showFailToast, showSuccessToast } from 'vant'
import 'vant/es/toast/style'

const router = useRouter()
const goRegister = () => {
    router.push('/register')
}
// 表单验证
const username = ref('')
const password = ref('')
const onSubmit = async (values) => {
    try {
        const result = await loginApi({
            userName: values.username,
            passWord: encryptPassword(values.password)
        })

        if (result.success && result.data?.accessToken) {
            setToken(result.data.accessToken)
            showSuccessToast('登录成功')
            await router.push('/home')
        } else {
            showFailToast(result.msg || '登录失败')
        }
    }
    catch (error) {
        console.error('登录失败', error)
        showFailToast('网络请求失败')
    }
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
    <div>
        <h1>登录</h1>
    </div>
    <!-- 表单 -->
    <van-form @submit="onSubmit">
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
                提交
            </van-button>
        </div>
    </van-form>

    <van-button plain block type="primary" @click="goRegister">
        没有账号？去注册
    </van-button>

</template>
<style lang="scss" scoped>
.submit-box {
    margin: 16px;
}
</style>
