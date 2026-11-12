import {createContext,useContext,useEffect,useMemo,useState,useSyncExternalStore} from 'react';
import type {ReactNode} from 'react';
import type {Preferences,QuranPage,SavedState} from '../types';
import {defaultState,readState,STORAGE_KEY} from '../utils/storage';
type Snapshot={state:SavedState;ready:boolean;storageError:boolean};
const serverSnapshot:Snapshot={state:defaultState,ready:false,storageError:false};
function createStore(){
 let snapshot=serverSnapshot;
 const listeners=new Set<()=>void>();
 const emit=()=>listeners.forEach(fn=>fn());
 const update=(fn:(s:SavedState)=>SavedState)=>{const state=fn(snapshot.state);let storageError=false;if(snapshot.ready){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{storageError=true;}}snapshot={...snapshot,state,storageError};emit();};
 return {
  getSnapshot:()=>snapshot,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
  initialize:()=>{if(snapshot.ready)return;snapshot={state:readState(),ready:true,storageError:false};emit();},
  setPreferences:(p:Partial<Preferences>)=>update(s=>({...s,preferences:{...s.preferences,...p}})),
  toggleBookmark:(page:number,key?:string)=>update(s=>{const id=key?`ayah-${key}`:`page-${page}`;return {...s,bookmarks:s.bookmarks.some(b=>b.id===id)?s.bookmarks.filter(b=>b.id!==id):[{id,page,key,createdAt:new Date().toISOString()},...s.bookmarks]};}),
  saveProgress:(page:number,key:string,surah:number)=>update(s=>({...s,progress:{page,key,updatedAt:new Date().toISOString()},recent:[surah,...s.recent.filter(n=>n!==surah)].slice(0,6)})),
 };
}
const Context=createContext<null|{store:ReturnType<typeof createStore>;initialPage?:QuranPage}>(null);
export function AppProvider({children,initialPage}:{children:ReactNode;initialPage?:QuranPage}){
 const [store]=useState(createStore);
 const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot,()=>serverSnapshot);
 const value=useMemo(()=>({store,initialPage}),[store,initialPage]);
 useEffect(()=>store.initialize(),[store]);
 useEffect(()=>{document.documentElement.dataset.theme=snapshot.state.preferences.theme;document.documentElement.lang=snapshot.state.preferences.language;},[snapshot.state.preferences.theme,snapshot.state.preferences.language]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp(){
 const c=useContext(Context);if(!c)throw new Error('AppProvider missing');
 // Keep the server snapshot stable until each Suspense boundary hydrates.
 const snapshot=useSyncExternalStore(c.store.subscribe,c.store.getSnapshot,()=>serverSnapshot);
 return {...snapshot,initialPage:c.initialPage,initialize:c.store.initialize,setPreferences:c.store.setPreferences,toggleBookmark:c.store.toggleBookmark,saveProgress:c.store.saveProgress};
}
