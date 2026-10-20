// Every Button tone × size × content and every IconButton tone × size. The
// loading test (tests/browser/button.spec.ts) measures each one idle and loading.
export const tones=['primary','secondary','ghost','danger'] as const;
export const iconTones=['ghost','secondary','danger'] as const;
export const sizes=['sm','md','lg'] as const;
// "wrapped" sits in a narrow column, so its label takes two lines or more.
export const contents=[
 {id:'label',text:'저장'},
 {id:'icon',text:'내보내기',icon:'upload'},
 {id:'wrapped',text:'변경 사항을 저장하고 승인 요청 보내기'},
] as const;
