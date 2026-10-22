import { useEffect, useRef } from "react";
import type { LeftNavProps } from "./left-nav";
export type TopNavProps = Pick<LeftNavProps,"surface"|"activePath"|"nav"|"labels"|"onNavigate">;
export function TopNav({surface,activePath,nav,labels,onNavigate}:TopNavProps){
  const root=useRef<HTMLElement>(null);
  useEffect(()=>{
    function outside(event:PointerEvent){if(!root.current?.contains(event.target as Node))root.current?.querySelectorAll("details[open]").forEach(el=>el.removeAttribute("open"));}
    document.addEventListener("pointerdown",outside);return()=>document.removeEventListener("pointerdown",outside);
  },[]);
  return <nav ref={root} className="dds-top-nav" aria-label={labels.nav} onKeyDown={event=>{
    if(event.key!=="Escape")return;
    const details=(event.target as Element).closest("details");
    if(details?.open){event.preventDefault();event.stopPropagation();details.open=false;details.querySelector("summary")?.focus();}
  }}>
    {nav.map((group,index)=><details key={group.id??index} className="dds-top-nav__group">
      <summary className="dds-top-nav__trigger">{group.label}</summary>
      <ul className="dds-top-nav__items">{group.items.map(item=><li key={item.id}><a className="dds-top-nav__item" data-nav={`${surface}.${item.id}`} href={item.href}
        aria-current={(item.active??(activePath===item.href||(item.href.split("/").filter(Boolean).length>1 && activePath.startsWith(`${item.href}/`))))?"page":undefined}
        onClick={event=>{event.currentTarget.closest("details")?.removeAttribute("open");onNavigate?.()}}>
        {item.icon!=null && <span className="dds-top-nav__item-icon" aria-hidden="true">{item.icon}</span>}<span>{item.label}</span>
        {item.badge!=null && item.badge>0 && <span className="dds-console-rail__badge" aria-label={labels.badge.replace("{count}",()=>String(item.badge))}>{item.badge}</span>}
      </a></li>)}</ul>
    </details>)}
  </nav>;
}
