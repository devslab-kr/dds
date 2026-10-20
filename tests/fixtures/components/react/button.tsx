import {StrictMode,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button,IconButton} from '../../../../packages/dds-react/src/controls';
import {Icon} from '../../../../packages/dds-react/src/icon';
import '../../../../packages/dds-react/styles.css';
import '../layout.css';
import '../button.css';
import {contents,iconTones,sizes,tones} from '../buttons';
function App(){
 const [loading,setLoading]=useState(false),[clicks,setClicks]=useState(0);
 const click=()=>setClicks(count=>count+1);
 return <main><h1>DDS buttons · React</h1>
 <button type="button" onClick={()=>setLoading(value=>!value)}>Toggle loading</button><output aria-label="Clicks">{clicks}</output>
 <section aria-label="Buttons" className="button-grid">{tones.flatMap(tone=>sizes.flatMap(size=>contents.map(content=>
  <div key={`${tone}-${size}-${content.id}`} className={content.id==='wrapped'?'button-case button-case--narrow':'button-case'} data-case={`${tone} ${size} ${content.id}`} data-name={content.text}>
   <Button tone={tone} size={size} loading={loading} onClick={click}>{'icon' in content&&<Icon name={content.icon} size={16}/>}{content.text}</Button><span className="button-after" aria-hidden="true"/>
  </div>)))}</section>
 <section aria-label="Icon buttons" className="button-grid">{iconTones.flatMap(tone=>sizes.map(size=>
  <div key={`${tone}-${size}`} className="button-case" data-case={`icon ${tone} ${size}`} data-name={`설정 ${tone} ${size}`}>
   <IconButton tone={tone} size={size} loading={loading} aria-label={`설정 ${tone} ${size}`} onClick={click}><Icon name="tool"/></IconButton><span className="button-after" aria-hidden="true"/>
  </div>))}</section>
 </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
