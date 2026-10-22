import { defineComponent, h } from 'vue'
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral'
export function createStatusPill<D extends string>(config: { tones: Record<D, Record<string, StatusTone>>; label: (domain: D, value: string, locale: string) => string | undefined; openDomains?: readonly NoInfer<D>[] }) {
  const open = new Set<string>(config.openDomains ?? [])
  return defineComponent((p: { domain: D; value: string; locale?: string }) => {
    return () => { const tone = config.tones[p.domain]?.[p.value]; const label = config.label(p.domain, p.value, p.locale ?? 'ko-KR'); const status = `${p.domain}.${p.value}`
      if (!tone || !label) { if (open.has(p.domain)) return h('code', { 'data-status': status }, p.value); throw new Error(`StatusPill: no ${tone ? 'label' : 'tone'} for ${status}`) }
      return h('span', { class: ['dds-badge', tone !== 'neutral' && `dds-badge--${tone}`], 'data-status': status, 'data-tone': tone }, label)
    }
  }, { name: 'DdsStatusPill', props: ['domain', 'value', 'locale'] })
}
