<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">体测系统</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/admin/students">
          <el-icon><User /></el-icon>
          <span>学生管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/classes">
          <el-icon><School /></el-icon>
          <span>班级管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/grades">
          <el-icon><Reading /></el-icon>
          <span>年级管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/forms">
          <el-icon><Document /></el-icon>
          <span>体测表单</span>
        </el-menu-item>
        <el-menu-item index="/admin/statistics">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-title">{{ pageTitle }}</div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              <span>管理员</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = computed(() => route.path);
const pageTitle = computed(() => route.meta.title || '');

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确认退出登录？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      userStore.logout();
      router.push('/login');
    });
  }
};
</script>

<style scoped lang="scss">
.layout-container {
  width: 100%;
  height: 100%;
}

.sidebar {
  background-color: #304156;
  color: #fff;

  .logo {
    height: 60px;
    line-height: 60px;
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    background-color: #2b3a4a;
  }

  .el-menu {
    border-right: none;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;

  .header-title {
    font-size: 18px;
    font-weight: bold;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;

    &:hover {
      color: #409eff;
    }
  }
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
