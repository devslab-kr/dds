export type StatusTone = "success" | "warning" | "danger" | "info" | "brand" | "neutral";
export function createStatusPill<D extends string>(config:{
 tones:Record<D,Record<string,StatusTone>>;
 label:(domain:D,value:string,locale:string)=>string|undefined;
 openDomains?:readonly NoInfer<D>[];
}){
 const open=new Set<string>(config.openDomains??[]);
 return function StatusPill(props:{domain:D;value:string;locale:string}){
  const tone=config.tones[props.domain]?.[props.value];
  const label=config.label(props.domain,props.value,props.locale);
  if(!tone||!label){
   if(open.has(props.domain))return <code data-status={`${props.domain}.${props.value}`}>{props.value}</code>;
   throw new Error(!tone?`StatusPill: no tone for ${props.domain}.${props.value}`:`StatusPill: no label for ${props.domain}.${props.value}`);
  }
  return <span className={tone==='neutral'?'dds-badge':`dds-badge dds-badge--${tone}`} data-status={`${props.domain}.${props.value}`} data-tone={tone}>{label}</span>;
 };
}
