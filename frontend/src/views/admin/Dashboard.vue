<template>
  <div class="dashboard">
    <h1>欢迎使用学校体测数据管理系统</h1>
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">0</div>
              <div class="stat-label">学生总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="30"><School /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">0</div>
              <div class="stat-label">班级总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="30"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">0</div>
              <div class="stat-label">体测表单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="30"><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">0</div>
              <div class="stat-label">测试记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// TODO: 获取统计数据
</script>

<style scoped lang="scss">
.dashboard {
  h1 {
    font-size: 24px;
    color: #333;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 10px;
    color: white;
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      font-size: 14px;
      color: #999;
      margin-top: 5px;
    }
  }
}
</style>
