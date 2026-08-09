import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { CatalogSkill, SkillStatus, UserSkill } from '@/types';

type ThemeMode='light'|'dark';
type AppState={skills:UserSkill[];theme:ThemeMode;addSkill:(s:CatalogSkill)=>void;addCustomSkill:(name:string,category:string)=>void;updateSkill:(id:string,patch:Partial<UserSkill>)=>void;removeSkill:(id:string)=>void;setTheme:(t:ThemeMode)=>void};
const C=createContext<AppState|null>(null);
export function AppProvider({children}:{children:ReactNode}){
 const [skills,setSkills]=useState<UserSkill[]>([]); const [theme,setThemeState]=useState<ThemeMode>(Appearance.getColorScheme()==='dark'?'dark':'light');
 useEffect(()=>{AsyncStorage.multiGet(['skillplus.skills','skillplus.theme']).then((rows)=>{if(rows[0][1])setSkills(JSON.parse(rows[0][1]!));if(rows[1][1])setThemeState(rows[1][1] as ThemeMode)});},[]);
 useEffect(()=>{AsyncStorage.setItem('skillplus.skills',JSON.stringify(skills));},[skills]);
 const addSkill=(s:CatalogSkill)=>setSkills(v=>v.some(x=>x.id===s.id)?v:[...v,{...s,userSkillId:`local-${Date.now()}`,status:'in_progress',repetitions:0,seconds:0,xp:0}]);
 const addCustomSkill=(name:string,category:string)=>addSkill({id:`custom-${Date.now()}`,name,category,subCategory:'Custom',difficulty:'Beginner',estimatedHours:'—',description:'A custom learning goal.'});
 const updateSkill=(id:string,patch:Partial<UserSkill>)=>setSkills(v=>v.map(s=>s.userSkillId===id?{...s,...patch}:s));
 const removeSkill=(id:string)=>setSkills(v=>v.filter(s=>s.userSkillId!==id));
 const setTheme=(t:ThemeMode)=>{setThemeState(t);AsyncStorage.setItem('skillplus.theme',t)};
 return <C.Provider value={useMemo(()=>({skills,theme,addSkill,addCustomSkill,updateSkill,removeSkill,setTheme}),[skills,theme])}>{children}</C.Provider>
}
export const useApp=()=>{const v=useContext(C);if(!v)throw new Error('AppProvider missing');return v};
export const palette = (dark: boolean) =>
  dark
    ? {
        bg: '#121212',
        card: '#1A1A1A',
        text: '#FFFFFF',
        muted: '#A3A3A3',
        primary: '#FF6A00',
        secondary: '#FF8C1A',
        border: '#2A2A2A',
        danger: '#FF3B30',
      }
    : {
        bg: '#F7F7F7',
        card: '#FFFFFF',
        text: '#121212',
        muted: '#6B6B6B',
        primary: '#FF6A00',
        secondary: '#FF8C1A',
        border: '#E2E2E2',
        danger: '#D93025',
      };
