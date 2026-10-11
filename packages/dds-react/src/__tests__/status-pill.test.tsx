import {render,screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {expect,it} from 'vitest';
import {createStatusPill} from '../index';
const config={tones:{job:{ready:'success' as const}},label:(_domain:string,value:string,locale:string)=>value==='ready'?(locale==='ko'?'준비됨':'Ready'):undefined};
it('updates tone and localized text on prop changes',()=>{
 const Pill=createStatusPill(config);const {rerender}=render(<Pill domain="job" value="ready" locale="ko"/>);
 expect(screen.getByText('준비됨')).toHaveAttribute('data-tone','success');
 rerender(<Pill domain="job" value="ready" locale="en"/>);
 expect(screen.getByText('Ready')).toHaveClass('dds-badge--success');
});
it('rejects unknown closed statuses and escapes unknown open values',()=>{
 const Closed=createStatusPill(config);const Open=createStatusPill({...config,openDomains:['job']});
 expect(()=>renderToString(<Closed domain="job" value="missing" locale="ko"/>)).toThrow('no tone');
 const html=renderToString(<Open domain="job" value="<script>unsafe</script>" locale="ko"/>);
 expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');
});
