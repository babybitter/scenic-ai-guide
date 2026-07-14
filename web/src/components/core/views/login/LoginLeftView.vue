<!-- 登录、注册、忘记密码左侧背景：景区实景图 + 暗色蒙层 -->
<template>
  <div class="login-left-view" :style="bgStyle">
    <!-- 暗色蒙层：保证 logo 与标题文字在实景图上清晰可读 -->
    <div class="scenic-overlay"></div>

    <div class="logo">
      <ArtLogo class="icon" size="46" />
      <h1 class="title">{{ AppConfig.systemInfo.name }}</h1>
    </div>

    <div class="text-wrap">
      <h1> {{ $t('login.leftView.title') }} </h1>
      <p> {{ $t('login.leftView.subTitle') }} </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppConfig from '@/config'

  // 定义 props
  defineProps<{
    hideContent?: boolean // 是否隐藏内容，只显示 logo
  }>()

  // 景区背景图放在 public 目录，走 BASE_URL 引用（兼容子路径部署）。
  // 图片缺失时不会导致构建失败，会回退到下方的主题底色。
  // 替换 web/public/images/login-bg.png 即可换成正式景区实景图。
  const bgStyle = computed(() => ({
    backgroundImage: `url('${import.meta.env.BASE_URL}images/login-bg.png')`
  }))
</script>

<style lang="scss" scoped>
  .login-left-view {
    position: relative;
    box-sizing: border-box;
    width: 65vw;
    height: 100%;
    padding: 20px;
    overflow: hidden;
    // 实景图未就绪时的回退底色（灵山主题墨绿），保证不会出现空白/破图
    background-color: #10302c;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;

    // 暗色蒙层：顶部轻、底部重，兼顾整体压暗与底部标题可读性
    .scenic-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      background: linear-gradient(
        180deg,
        rgb(0 0 0 / 30%) 0%,
        rgb(0 0 0 / 14%) 42%,
        rgb(0 0 0 / 62%) 100%
      );
    }

    .logo {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;

      .title {
        margin-left: 10px;
        font-size: 20px;
        font-weight: 400;
        color: #fff;
        text-shadow: 0 1px 8px rgb(0 0 0 / 45%);
      }
    }

    .text-wrap {
      position: absolute;
      bottom: 80px;
      left: 0;
      z-index: 10;
      box-sizing: border-box;
      width: 100%;
      padding: 0 24px;
      text-align: center;
      animation: slideInLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;

      h1 {
        font-size: 26px;
        font-weight: 500;
        color: #fff !important;
        text-shadow: 0 2px 14px rgb(0 0 0 / 50%);
      }

      p {
        margin-top: 10px;
        font-size: 14px;
        color: rgb(255 255 255 / 85%) !important;
        text-shadow: 0 1px 10px rgb(0 0 0 / 45%);
      }
    }

    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }

      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @media only screen and (width <= 1600px) {
      width: 60vw;

      .text-wrap {
        bottom: 40px;
      }
    }

    // 窄屏（移动端）：左侧背景整体隐藏，仅保留右侧表单
    @media only screen and (width <= 1180px) {
      width: auto;
      height: auto;
      padding: 0;
      background: transparent;

      .scenic-overlay,
      .text-wrap,
      .logo {
        display: none;
      }
    }
  }

  // 暗色主题：底色更深，蒙层更重
  .dark .login-left-view {
    background-color: #0a1f1c;

    .scenic-overlay {
      background: linear-gradient(
        180deg,
        rgb(0 0 0 / 45%) 0%,
        rgb(0 0 0 / 30%) 42%,
        rgb(0 0 0 / 72%) 100%
      );
    }

    @media only screen and (width <= 1180px) {
      background: transparent;
    }
  }
</style>
