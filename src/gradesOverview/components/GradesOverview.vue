<template>
  <Chart type="bar" :data="data" :options="basicOptions" />
</template>

<script setup lang="ts">
import Chart from 'primevue/chart'
import { ref } from 'vue'

const data = ref({
  labels: ['1', '2', '3', '4', '5', '6'],
  datasets: [
    {
      label: 'Klausur 1',
      data: [3, 10, 7, 4, 1, 0]
    }
  ]
})

const basicOptions = ref({
  plugins: {
    legend: {
      labels: {
        color: '#495057'
      }
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#495057'
      },
      grid: {
        color: '#ebedef'
      }
    },
    y: {
      ticks: {
        color: '#495057'
      },
      grid: {
        color: '#ebedef'
      }
    }
  }
})
</script>
