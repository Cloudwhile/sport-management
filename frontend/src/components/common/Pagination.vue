<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
}

const props = defineProps<PaginationProps>()

const emit = defineEmits<{
  'page-change': [page: number]
  'size-change': [size: number]
}>()

const pageSizes = [10, 20, 50, 100]

const displayPages = computed(() => {
  const pages: (number | string)[] = []
  const maxVisible = 7

  if (props.totalPages <= maxVisible) {
    for (let i = 1; i <= props.totalPages; i++) {
      pages.push(i)
    }
  } else {
    if (props.currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(props.totalPages)
    } else if (props.currentPage >= props.totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = props.totalPages - 4; i <= props.totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = props.currentPage - 1; i <= props.currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(props.totalPages)
    }
  }

  return pages
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}

const changePageSize = (event: Event) => {
  const size = Number((event.target as HTMLSelectElement).value)
  emit('size-change', size)
}

const rangeStart = computed(() => {
  return (props.currentPage - 1) * props.pageSize + 1
})

const rangeEnd = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalItems)
})
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
    <!-- 左侧：显示信息 -->
    <div class="flex items-center gap-4">
      <p class="text-sm text-gray-700">
        显示 <span class="font-medium">{{ rangeStart }}</span> 到 <span class="font-medium">{{ rangeEnd }}</span> 条，
        共 <span class="font-medium">{{ totalItems }}</span> 条
      </p>
      <div class="flex items-center gap-2">
        <label for="page-size" class="text-sm text-gray-700">每页</label>
        <select
          id="page-size"
          :value="pageSize"
          class="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="changePageSize"
        >
          <option v-for="size in pageSizes" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
        <span class="text-sm text-gray-700">条</span>
      </div>
    </div>

    <!-- 右侧：页码导航 -->
    <nav class="flex items-center gap-2">
      <!-- 上一页 -->
      <button
        type="button"
        :disabled="currentPage === 1"
        class="inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="goToPage(currentPage - 1)"
      >
        <ChevronLeftIcon class="h-5 w-5" />
      </button>

      <!-- 页码 -->
      <div class="flex gap-1">
        <button
          v-for="(page, index) in displayPages"
          :key="index"
          type="button"
          :disabled="page === '...'"
          :class="[
            'px-3 py-1 text-sm font-medium rounded-md transition-colors',
            page === currentPage
              ? 'bg-blue-600 text-white'
              : page === '...'
              ? 'text-gray-500 cursor-default'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          ]"
          @click="typeof page === 'number' && goToPage(page)"
        >
          {{ page }}
        </button>
      </div>

      <!-- 下一页 -->
      <button
        type="button"
        :disabled="currentPage === totalPages"
        class="inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="goToPage(currentPage + 1)"
      >
        <ChevronRightIcon class="h-5 w-5" />
      </button>
    </nav>
  </div>
</template>
