import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const path=(relative:string)=>fileURLToPath(new URL(relative,import.meta.url));
export default defineConfig({
 root:path('./react/'), esbuild:{jsx:'automatic'},
 resolve:{alias:{'react-dom':path('../../../packages/dds-react/node_modules/react-dom'),'react':path('../../../packages/dds-react/node_modules/react')},dedupe:['react','react-dom']},
 server:{host:'127.0.0.1',port:5281,strictPort:true,fs:{allow:[path('../../../')]}},
});
