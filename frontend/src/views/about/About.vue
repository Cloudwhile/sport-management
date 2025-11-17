<script setup lang="ts">
import Card from '@/components/common/Card.vue'
import { EnvelopeIcon, CodeBracketIcon, GlobeAltIcon, CodeBracketSquareIcon } from '@heroicons/vue/24/outline'
import MD5 from 'crypto-js/md5'

// 团队成员信息
interface TeamMember {
  name: string
  role: string
  email: string
  gravatarEmail: string // 用于生成 Gravatar 的邮箱
  description: string
  blogUrl?: string // 博客链接（可选）
  githubUrl?: string // GitHub 链接（可选）
}


const teamMembers: TeamMember[] = [
  {
    name: 'AptS:1547',
    role: '全栈工程师',
    email: 'apts-1547@esaps.net',
    gravatarEmail: 'image@esaps.net',
    description: '负责系统架构设计与后端开发',
    blogUrl: 'https://www.esaps.net',
    githubUrl: 'https://github.com/AptS-1547'
  },
  {
    name: 'Cloudwhile',
    role: '全栈工程师',
    email: 'whitecat.this@gmail.com',
    gravatarEmail: 'linjunhao41@gmail.com',
    description: '负责算法设计与后端开发',
    blogUrl: 'https://icetowne.com',
    githubUrl: 'https://github.com/cloudwhile'
  }
]

// 获取应用标题
const appTitle = import.meta.env.VITE_APP_TITLE || '学校体测数据管理系统'

// 生成 Gravatar URL（使用 MD5 哈希）
const getGravatarUrl = (email: string, size: number = 200): string => {
  // 使用 MD5 哈希邮箱地址
  const emailLower = email.toLowerCase().trim()
  const hash = MD5(emailLower).toString()
  if (email.indexOf("linjunhao41") !== -1) {
    const hash = sha256(email).toString()
  }
  return `https://cravatar.cn/avatar/${hash}?s=${size}&d=identicon`
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">关于我们</h1>
      <p class="mt-1 text-sm text-gray-600">了解{{ appTitle }}的开发团队</p>
    </div>

    <!-- 系统介绍 -->
    <Card title="系统简介">
      <div class="prose max-w-none">
        <p class="text-gray-700 leading-relaxed">
          {{ appTitle }}是一个现代化的学校体育测试数据管理平台，致力于为学校提供高效、便捷的体测数据采集、管理和分析服务。
        </p>
        <p class="text-gray-700 leading-relaxed mt-4">
          系统采用前后端分离架构，使用 Vue 3 + TypeScript 构建前端界面，Node.js + Express + PostgreSQL 构建后端服务，
          为用户提供流畅的使用体验和可靠的数据安全保障。
        </p>
      </div>
    </Card>

    <!-- 开发团队 -->
    <Card title="开发团队">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="member in teamMembers" :key="member.email"
          class="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-start space-x-4">
            <!-- Gravatar 头像 -->
            <div class="flex-shrink-0">
              <img :src="getGravatarUrl(member.gravatarEmail, 120)" :alt="member.name"
                class="w-20 h-20 rounded-full border-4 border-white shadow-md" />
            </div>

            <!-- 成员信息 -->
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ member.name }}
              </h3>
              <p class="text-sm text-indigo-600 font-medium mt-1">
                {{ member.role }}
              </p>
              <p class="text-sm text-gray-600 mt-2">
                {{ member.description }}
              </p>

              <!-- 联系方式和链接 -->
              <div class="mt-3 space-y-2">
                <!-- Email -->
                <a :href="`mailto:${member.email}`"
                  class="flex items-center text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                  <EnvelopeIcon class="w-4 h-4 mr-1.5" />
                  <span>{{ member.email }}</span>
                </a>

                <!-- 博客和 GitHub 链接 -->
                <div class="flex items-center gap-3 pt-1">
                  <a v-if="member.blogUrl" :href="member.blogUrl" target="_blank" rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                    <GlobeAltIcon class="w-3.5 h-3.5 mr-1" />
                    访问博客
                  </a>
                  <a v-if="member.githubUrl" :href="member.githubUrl" target="_blank" rel="noopener noreferrer"
                    class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <CodeBracketSquareIcon class="w-3.5 h-3.5 mr-1" />
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- 技术栈 -->
    <Card title="技术栈">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 前端技术 -->
        <div>
          <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <CodeBracketIcon class="w-5 h-5 mr-2 text-indigo-600" />
            前端技术
          </h3>
          <ul class="space-y-2">
            <li class="flex items-center text-sm text-gray-700">
              <span class="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
              Vue 3 + TypeScript
            </li>
            <li class="flex items-center text-sm text-gray-700">
              <span class="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
              Vue Router + Pinia
            </li>
            <li class="flex items-center text-sm text-gray-700">
              <span class="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
              Tailwind CSS
            </li>
            <li class="flex items-center text-sm text-gray-700">
              <span class="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
              Chart.js
            </li>
          </ul>
        </div>

        <!-- 后端技术 -->
        <div>
          <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <CodeBracketIcon class="w-5 h-5 mr-2 text-green-600" />
            后端技术
          </h3>
          <ul class="space-y-2">
            <li class="flex items-center text-sm text-gray-700">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Node.js + Express
            </li>
            <li class="flex items-center text-sm text-gray-700">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              TypeScript
            </li>
            <li class="flex items-center text-sm text-gray-700">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              PostgreSQL + Sequelize
            </li>
            <li class="flex items-center text-sm text-gray-700">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              JWT 认证
            </li>
          </ul>
        </div>
      </div>
    </Card>

    <!-- 版本信息 -->
    <Card title="版本信息">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-500 uppercase tracking-wide">系统版本</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">1.0.0</p>
        </div>
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-500 uppercase tracking-wide">发布日期</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">2025-11</p>
        </div>
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-xs text-gray-500 uppercase tracking-wide">构建状态</p>
          <p class="text-2xl font-bold text-green-600 mt-1">稳定</p>
        </div>
      </div>
    </Card>

    <!-- 版权信息 -->
    <div class="text-center text-sm text-gray-500 py-4">
      <p>&copy; 2025 {{ appTitle }}. All rights reserved.</p>
    </div>
  </div>
</template>
