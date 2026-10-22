<script setup lang="ts">
import { DatePicker } from '@ark-ui/vue/date-picker'
import Button from './Button.vue'
import Icon from './Icon.vue'
defineProps<{ view?: 'day' | 'month' }>()
</script>
<template>
  <DatePicker.View :view="view ?? 'day'">
    <DatePicker.Context v-slot="picker">
      <DatePicker.ViewControl class="dds-date-picker-header">
        <DatePicker.PrevTrigger as-child><Button tone="secondary" :aria-label="view === 'month' ? '이전 해' : '이전 달'"><Icon name="chevron-left" /></Button></DatePicker.PrevTrigger>
        <span v-if="view === 'month'" class="dds-date-picker-year">{{ picker.visibleRange.start.year }}</span><DatePicker.RangeText v-else />
        <DatePicker.NextTrigger as-child><Button tone="secondary" :aria-label="view === 'month' ? '다음 해' : '다음 달'"><Icon name="chevron-right" /></Button></DatePicker.NextTrigger>
      </DatePicker.ViewControl>
      <DatePicker.Table class="dds-date-picker-table" :class="{ 'dds-date-picker-table--months': view === 'month' }">
        <DatePicker.TableHead v-if="view !== 'month'"><DatePicker.TableRow><DatePicker.TableHeader v-for="(day, i) in picker.weekDays" :key="i">{{ day.short }}</DatePicker.TableHeader></DatePicker.TableRow></DatePicker.TableHead>
        <DatePicker.TableBody v-if="view === 'month'"><DatePicker.TableRow v-for="(row, i) in picker.getMonthsGrid({ columns: 3, format: 'short' })" :key="i"><DatePicker.TableCell v-for="(month, j) in row" :key="j" :value="month.value"><DatePicker.TableCellTrigger>{{ month.label }}</DatePicker.TableCellTrigger></DatePicker.TableCell></DatePicker.TableRow></DatePicker.TableBody>
        <DatePicker.TableBody v-else><DatePicker.TableRow v-for="(week, i) in picker.weeks" :key="i"><DatePicker.TableCell v-for="(day, j) in week" :key="j" :value="day"><DatePicker.TableCellTrigger>{{ day.day }}</DatePicker.TableCellTrigger></DatePicker.TableCell></DatePicker.TableRow></DatePicker.TableBody>
      </DatePicker.Table>
      <div v-if="$slots.default" class="dds-date-picker-footer"><slot /></div>
    </DatePicker.Context>
  </DatePicker.View>
</template>
