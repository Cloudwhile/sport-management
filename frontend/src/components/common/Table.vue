<script setup lang="ts">
export interface TableColumn {
  key: string
  label: string
  width?: string
}

interface TableProps {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
}

const props = withDefaults(defineProps<TableProps>(), {
  loading: false
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="{ width: column.width }"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <template v-if="loading">
          <tr v-for="i in 5" :key="`skeleton-${i}`">
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4"
            >
              <div class="h-4 bg-gray-200 rounded animate-pulse" />
            </td>
          </tr>
        </template>
        <template v-else-if="data.length > 0">
          <tr
            v-for="(row, index) in data"
            :key="index"
            class="hover:bg-gray-50 transition-colors"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="row[column.key]"
              >
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </template>
        <tr v-else>
          <td
            :colspan="columns.length"
            class="px-6 py-8 text-center text-sm text-gray-500"
          >
            暂无数据
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
