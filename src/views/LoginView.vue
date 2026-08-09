<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginApi } from '@/api/userInfo'
import { encryptPassword } from '@/utils/encrypt'
import { setToken } from '@/utils/token'
import { showFailToast, showSuccessToast } from 'vant'
import 'vant/es/toast/style'

const router = useRouter()
const demoAccount = {
    username: 'zhangsan123',
    password: '46584769479467',
} as const

const goRegister = () => {
    router.push('/register')
}
// 表单验证
const username = ref('')
const password = ref('')
const submitting = ref(false)

const copyCredential = async (label: string, value: string) => {
    try {
        await navigator.clipboard.writeText(value)
    } catch {
        const input = document.createElement('textarea')
        input.value = value
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        input.remove()
    }

    showSuccessToast(`${label}已复制`)
}

const fillDemoAccount = () => {
    username.value = demoAccount.username
    password.value = demoAccount.password
    showSuccessToast('演示账号已填入')
}

const onSubmit = async (values) => {
    if (submitting.value) return
    submitting.value = true
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
    } finally {
        submitting.value = false
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
    <div class="auth-page">
        <div class="auth-hero">
            <div class="brand">移动商城</div>
            <h1>欢迎登录</h1>
            <p>登录后继续你的购物之旅</p>
        </div>

        <section class="demo-account" aria-labelledby="demo-account-title">
            <div class="demo-account-heading">
                <van-icon name="contact-o" aria-hidden="true" />
                <h2 id="demo-account-title">演示账号</h2>
            </div>
            <dl>
                <div>
                    <dt>账号</dt>
                    <dd>{{ demoAccount.username }}</dd>
                    <button type="button" class="credential-copy" aria-label="复制账号"
                        @click="copyCredential('账号', demoAccount.username)">
                        <van-icon name="description-o" aria-hidden="true" />
                        <span>复制</span>
                    </button>
                </div>
                <div>
                    <dt>密码</dt>
                    <dd>{{ demoAccount.password }}</dd>
                    <button type="button" class="credential-copy" aria-label="复制密码"
                        @click="copyCredential('密码', demoAccount.password)">
                        <van-icon name="description-o" aria-hidden="true" />
                        <span>复制</span>
                    </button>
                </div>
            </dl>
            <button type="button" class="fill-demo-account" @click="fillDemoAccount">
                <van-icon name="edit" aria-hidden="true" />
                <span>一键填入登录信息</span>
            </button>
        </section>

        <van-form class="auth-form" @submit="onSubmit">
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
                <van-button round block type="danger" native-type="submit" :loading="submitting" loading-text="登录中...">
                    登录
                </van-button>
            </div>
        </van-form>

        <van-button class="link-btn" plain block hairline type="danger" @click="goRegister">
            没有账号？去注册
        </van-button>
    </div>
</template>
<style lang="scss" scoped>
.auth-page {
    min-height: 100vh;
    padding: 80px 28px 48px;
    background:
        radial-gradient(circle at top right, rgba(238, 10, 36, 0.12), transparent 36%),
        linear-gradient(180deg, #fff 0%, var(--shop-bg) 48%, #fff 100%);
}

.auth-hero {
    margin: 0 12px 40px;

    .brand {
        display: inline-block;
        margin-bottom: 20px;
        padding: 8px 16px;
        border-radius: 999px;
        background: var(--shop-primary-soft);
        color: var(--shop-primary);
        font-size: 22px;
        font-weight: 600;
    }

    h1 {
        margin: 0;
        font-size: 48px;
        font-weight: 700;
        color: var(--shop-text);
    }

    p {
        margin: 16px 0 0;
        color: var(--shop-text-secondary);
        font-size: 26px;
    }
}

.auth-form {
    :deep(.van-cell-group--inset) {
        margin: 0;
        overflow: hidden;
        border-radius: var(--shop-radius);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
    }
}

.demo-account {
    margin: 0 0 28px;
    padding: 24px;
    border: 1px solid rgba(238, 10, 36, 0.12);
    border-radius: var(--shop-radius);
    background: var(--shop-card);
    box-shadow: 0 8px 24px rgba(50, 50, 51, 0.04);

    dl {
        margin: 18px 0 0;
        display: grid;
        gap: 12px;
    }

    dl > div {
        min-width: 0;
        padding: 14px 16px;
        display: grid;
        grid-template-columns: 72px minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        border-radius: var(--shop-radius-sm);
        background: var(--shop-bg);
    }

    dt {
        color: var(--shop-text-secondary);
        font-size: 22px;
    }

    dd {
        margin: 0;
        color: var(--shop-text);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 24px;
        font-weight: 600;
        overflow-wrap: anywhere;
        user-select: text;
        -webkit-user-select: text;
    }
}

.credential-copy,
.fill-demo-account {
    border: 0;
    font: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}

.credential-copy {
    padding: 8px 10px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 999px;
    background: var(--shop-card);
    color: var(--shop-primary);
    font-size: 20px;
}

.fill-demo-account {
    width: 100%;
    margin-top: 16px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: var(--shop-radius-sm);
    background: var(--shop-primary-soft);
    color: var(--shop-primary);
    font-size: 22px;
    font-weight: 600;
}

.credential-copy:focus-visible,
.fill-demo-account:focus-visible {
    outline: 2px solid var(--shop-primary);
    outline-offset: 2px;
}

.demo-account-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--shop-primary);

    :deep(.van-icon) {
        font-size: 30px;
    }

    h2 {
        margin: 0;
        color: var(--shop-text);
        font-size: 28px;
        font-weight: 650;
    }
}

.submit-box {
    margin: 32px 0 20px;
}

.link-btn {
    border-radius: 999px;
}
</style>
