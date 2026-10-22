import TwoShells from './fixtures/TwoShells.svelte';
import {render} from 'svelte/server';import{expect,it}from'vitest';import{ConsoleShell,Layout,LeftNav,TopNav}from'../src/lib';
const labels={skip:'Skip',menuOpen:'Open',menuClose:'Close',nav:'Navigation',badge:'{count} items'};
const nav=[{id:'work',label:'Work',collapsible:true,items:[{id:'p',href:'/products',label:'Products'}]}];
it('server renders exports and closed groups without browser globals',()=>{
 for(const component of [Layout,LeftNav,TopNav,ConsoleShell]){
 const html=render(component as typeof ConsoleShell,{props:{surface:'test',activePath:'/products',nav,labels,...(component===ConsoleShell?{header:{title:'Title'}}:{}),brand:{href:'/',name:'DDS',mark:'/mark.svg'},defaultExpandedGroups:[]}}).body;
 expect(html.length).toBeGreaterThan(0);expect(html).not.toContain('data-hydrated');
 if(component===ConsoleShell||component===LeftNav){expect(html).toContain('aria-expanded="false"');expect(html).toMatch(/<ul[^>]*hidden/);}
 }
});

it('gives two shells unique SSR IDs and matching disclosure targets',()=>{
 const html=render(TwoShells,{props:{surface:'test',activePath:'/products',nav,labels,header:{title:'Title'},brand:{href:'/',name:'DDS',mark:'/mark.svg'}}}).body;
 const ids=[...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);expect(new Set(ids).size).toBe(ids.length);
 for(const target of html.matchAll(/aria-controls="([^"]+)"/g))expect(ids).toContain(target[1]);
});
