import {createSignal} from 'solid-js';
import {render} from 'solid-js/web';
import {Button,IconButton} from '../../../../packages/dds-solid/src/controls';
import {Icon} from '../../../../packages/dds-solid/src/icon';
import '../../../../packages/dds-solid/styles.css';
import '../layout.css';
import '../button.css';
import {contents,iconTones,sizes,tones} from '../buttons';
function App(){
 const [loading,setLoading]=createSignal(false),[clicks,setClicks]=createSignal(0);
 const click=()=>setClicks(count=>count+1);
 return <main><h1>DDS buttons · Solid</h1>
 <button type="button" onClick={()=>setLoading(value=>!value)}>Toggle loading</button><output aria-label="Clicks">{clicks()}</output>
 <section aria-label="Buttons" class="button-grid">{tones.flatMap(tone=>sizes.flatMap(size=>contents.map(content=>
  <div class={content.id==='wrapped'?'button-case button-case--narrow':'button-case'} data-case={`${tone} ${size} ${content.id}`} data-name={content.text}>
   <Button tone={tone} size={size} loading={loading()} onClick={click}>{'icon' in content&&<Icon name={content.icon} size={16}/>}{content.text}</Button><span class="button-after" aria-hidden="true"/>
  </div>)))}</section>
 <section aria-label="Icon buttons" class="button-grid">{iconTones.flatMap(tone=>sizes.map(size=>
  <div class="button-case" data-case={`icon ${tone} ${size}`} data-name={`설정 ${tone} ${size}`}>
   <IconButton tone={tone} size={size} loading={loading()} aria-label={`설정 ${tone} ${size}`} onClick={click}><Icon name="tool"/></IconButton><span class="button-after" aria-hidden="true"/>
  </div>))}</section>
 </main>;
}
render(()=><App/>,document.getElementById('root')!);
