import { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
type Auth={user:User|null;loading:boolean;signIn:(e:string,p:string)=>Promise<string|null>;signUp:(n:string,e:string,p:string)=>Promise<string|null>;reset:(e:string)=>Promise<string|null>;signOut:()=>Promise<void>};
const C=createContext<Auth|null>(null);
export function AuthProvider({children}:{children:ReactNode}){const [session,setSession]=useState<Session|null>(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!isSupabaseConfigured){setLoading(false);return}supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>data.subscription.unsubscribe()},[]);
 const signIn=async(e:string,p:string)=>{if(!isSupabaseConfigured)return 'Add your Supabase URL and anon key to .env first.';const {error}=await supabase.auth.signInWithPassword({email:e,password:p});return error?.message??null};
 const signUp=async(n:string,e:string,p:string)=>{if(!isSupabaseConfigured)return 'Add your Supabase URL and anon key to .env first.';const {error}=await supabase.auth.signUp({email:e,password:p,options:{data:{display_name:n}}});return error?.message??null};
 const reset=async(e:string)=>{if(!isSupabaseConfigured)return 'Add your Supabase URL and anon key to .env first.';const {error}=await supabase.auth.resetPasswordForEmail(e,{redirectTo:'skillplus://reset-password'});return error?.message??null};
 return <C.Provider value={{user:session?.user??null,loading,signIn,signUp,reset,signOut:async()=>{await supabase.auth.signOut()}}}>{children}</C.Provider>}
export const useAuth=()=>{const v=useContext(C);if(!v)throw new Error('AuthProvider missing');return v};
