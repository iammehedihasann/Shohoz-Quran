import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export default defineConfig({plugins:[react(),tailwindcss(),{name:'static-directory-routes',configurePreviewServer(server){server.middlewares.use((req,res,next)=>{const url=new URL(req.url??'/','http://localhost');if(!/\.[a-z0-9]+$/i.test(url.pathname)&&url.pathname!=='/'){const valid=/^\/(?:surahs|juz|about|search|bookmarks|settings|(?:read|surah|juz)\/\d+)\/?$/.test(url.pathname)&&existsSync(resolve('dist',`.${url.pathname}/index.html`));if(valid&&!url.pathname.endsWith('/')){res.statusCode=308;res.setHeader('Location',`${url.pathname}/${url.search}`);res.end();return;}if(!valid){res.statusCode=404;res.setHeader('Content-Type','text/html');res.end(readFileSync('dist/404.html'));return;}}next();});}}],build:{target:'es2022',rollupOptions:{output:{manualChunks:{react:['react','react-dom','react-dom/client','react-router-dom']}}}}});
