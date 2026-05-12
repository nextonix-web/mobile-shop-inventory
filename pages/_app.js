import '../styles/globals.css';
import AuthGate from '../components/AuthGate';
import Layout from '../components/Layout';
export default function App({Component,pageProps}){return <AuthGate><Layout><Component {...pageProps}/></Layout></AuthGate>}
