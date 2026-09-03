<script lang="ts" setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { loginApi } from "@/api/userInfo";
import { setToken } from "@/utils/token";
import { showFailToast, showSuccessToast } from "vant";
import "vant/es/toast/style";

const router = useRouter();
const route = useRoute();

const goRegister = () => {
    router.push("/register");
};
// 表单验证
const username = ref("");
const password = ref("");
const submitting = ref(false);

const onSubmit = async (values) => {
    if (submitting.value) return;
    submitting.value = true;
    try {
        const result = await loginApi({
            userName: values.username,
            passWord: values.password,
        });

        if (result.success && result.data?.accessToken) {
            setToken(result.data.accessToken);
            showSuccessToast("登录成功");
            const redirect = route.query.redirect;
            await router.replace(typeof redirect === "string" ? redirect : "/home");
        } else {
            showFailToast(result.msg || "登录失败");
        }
    } catch (error) {
        console.error("登录失败", error);
        showFailToast("网络请求失败");
    } finally {
        submitting.value = false;
    }
};
// 正则
const usernameValidator = (value) => {
    return /^\w{3,16}$/.test(value);
};

const passwordValidator = (value) => {
    return /^\d{6,16}$/.test(value);
};
</script>
<template>
    <div class="auth-page">
        <div class="auth-hero">
            <div class="brand">轻购</div>
            <h1>欢迎登录</h1>
            <p>登录后继续你的购物之旅</p>
        </div>

        <van-form class="auth-form" @submit="onSubmit">
            <van-cell-group inset>
                <van-field
                    v-model="username"
                    name="username"
                    label="用户名"
                    placeholder="用户名"
                    :rules="[
                        { required: true, message: '请填写用户名' },
                        {
                            validator: usernameValidator,
                            message: '用户名必须是3到16位数字、字母或下划线',
                        },
                    ]"
                />
                <van-field
                    v-model="password"
                    type="password"
                    name="password"
                    label="密码"
                    placeholder="密码"
                    :rules="[
                        { required: true, message: '请填写密码' },
                        {
                            validator: passwordValidator,
                            message: '密码必须是6到16位数字',
                        },
                    ]"
                />
            </van-cell-group>
            <div class="submit-box">
                <van-button
                    round
                    block
                    type="danger"
                    native-type="submit"
                    :loading="submitting"
                    loading-text="登录中..."
                >
                    登录
                </van-button>
            </div>
        </van-form>

        <van-button
            class="link-btn"
            plain
            block
            hairline
            type="danger"
            @click="goRegister"
        >
            没有账号？去注册
        </van-button>
    </div>
</template>
<style lang="scss" scoped>
.auth-page {
    min-height: 100vh;
    padding: 80px 28px 48px;
    background:
        radial-gradient(
            circle at top right,
            rgba(238, 10, 36, 0.12),
            transparent 36%
        ),
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


.submit-box {
    margin: 32px 0 20px;
}

.link-btn {
    border-radius: 999px;
}
</style>
