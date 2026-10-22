import { forwardRef, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { classes } from "./controls";
export interface LayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  navigationPosition?: "left" | "top";
  contentWidth?: "workspace" | "form" | "settings" | "full";
  labels: { skip: string; menuOpen: string; menuClose: string };
  header?: ReactNode; navigation?: ReactNode; railStart?: ReactNode; railEnd?: ReactNode; footer?: ReactNode; children: ReactNode;
  surface?: string;
}
export const Layout = forwardRef<HTMLDivElement, LayoutProps>(function Layout({navigationPosition="left",contentWidth="workspace",labels,header,navigation,railStart,railEnd,footer,children,surface,className,...rest},ref) {
  const id=useId(), railId=`dds-console-rail-${id}`, mainId=`dds-console-main-${id}`;
  const [open,setOpen]=useState(false), [hydrated,setHydrated]=useState(false);
  const toggle=useRef<HTMLButtonElement>(null), rail=useRef<HTMLElement>(null);
  function close() { setOpen(false); toggle.current?.focus(); }
  useEffect(()=>{setHydrated(true)},[]);
  useEffect(()=>{
    if(!open)return;
    const focusable=()=>[toggle.current,...Array.from(rail.current?.querySelectorAll<HTMLElement>('a[href],button,summary,input,select,textarea,[tabindex="0"]')??[])].filter((el):el is HTMLElement=>!!el && !el.closest('[hidden]') && el.getClientRects().length>0 && !el.hasAttribute('disabled'));
    const frame=requestAnimationFrame(()=>focusable()[1]?.focus());
    function key(event:KeyboardEvent){
      if(event.key==="Escape"){event.preventDefault();close();}
      if(event.key==="Tab"){
        const items=focusable(), first=items[0], last=items.at(-1);
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
      }
    }
    document.addEventListener("keydown",key);
    return()=>{cancelAnimationFrame(frame);document.removeEventListener("keydown",key)};
  },[open]);
  return <div {...rest} ref={ref} className={classes("dds-console-shell dds-layout",className)} data-navigation-position={navigationPosition} data-surface={surface} data-hydrated={hydrated?"true":undefined}>
    <a className="dds-console-skip dds-visually-hidden" href={`#${mainId}`}>{labels.skip}</a>
    <button ref={toggle} className="dds-console-rail__toggle" type="button" data-action="toggle-rail" aria-controls={railId} aria-expanded={open} onClick={()=>open?close():setOpen(true)}><span aria-hidden/><span className="dds-visually-hidden">{open?labels.menuClose:labels.menuOpen}</span></button>
    <div className="dds-console-rail__scrim" data-open={String(open)} onClick={close}/>
    <aside ref={rail} id={railId} className="dds-console-rail dds-layout__navigation" data-open={String(open)} onClick={event=>{if(open && event.target instanceof Element && event.target.closest("a[href]"))close()}}>
      {railStart}{navigation}{railEnd}
    </aside>
    <main id={mainId} className="dds-console-main dds-layout__main" tabIndex={-1}>
      <div className="dds-layout__content" data-width={contentWidth}>
        {header!=null && <header className="dds-layout__header">{header}</header>}
        {children}{footer!=null && <footer className="dds-layout__footer">{footer}</footer>}
      </div>
    </main>
  </div>;
});
