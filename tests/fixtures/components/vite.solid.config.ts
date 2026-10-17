import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import solid from '../../../packages/dds-solid/node_modules/vite-plugin-solid/dist/esm/index.mjs';
const path=(relative:string)=>fileURLToPath(new URL(relative,import.meta.url));
export default defineConfig({
 root:path('./solid/'),plugins:[solid({hot:false})],
 resolve:{alias:[{find:/^solid-js\/web$/,replacement:path('../../../packages/dds-solid/node_modules/solid-js/web/dist/web.js')},{find:/^solid-js\/store$/,replacement:path('../../../packages/dds-solid/node_modules/solid-js/store/dist/store.js')},{find:/^solid-js$/,replacement:path('../../../packages/dds-solid/node_modules/solid-js/dist/solid.js')},{find:/^solid-js\//,replacement:path('../../../packages/dds-solid/node_modules/solid-js/')}],dedupe:['solid-js']},
 server:{host:'127.0.0.1',port:5282,strictPort:true,fs:{allow:[path('../../../')]}},
});
