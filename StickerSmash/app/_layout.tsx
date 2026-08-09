import { Stack } from 'expo-router';import { StatusBar } from 'expo-status-bar';import { AppProvider,useApp } from '@/contexts/AppContext';import { AuthProvider } from '@/contexts/AuthContext';
function Root(){const{theme}=useApp();return <><StatusBar style={theme==='dark'?'light':'dark'}/><AuthProvider><Stack screenOptions={{headerShown:false}}/></AuthProvider></>}
export default function Layout(){return <AppProvider><Root/></AppProvider>}
