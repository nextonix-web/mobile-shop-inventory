import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const links=[
  ['/','Dashboard'],
  ['/products','Inventory'],
  ['/sales','Sales'],
  ['/customers','Customers'],
  ['/purchases','Purchases'],
  ['/expenses','Expenses'],
  ['/reports','Reports'],
  ['/settings','Settings']
];

export default function Layout({children}){
  const r=useRouter();

  return (
    <div className="app">
      <aside className="sidebar">
<div className="brand">
  <img src="/logo.png" alt="Logo" className="sidebar-logo" />

  <div>
    <div className="brand-title">Beijing Mobile</div>
    <div className="brand-subtitle">Inventory System</div>
  </div>
</div>
        <nav className="nav">
          {links.map(([href,label])=>(
            <Link
              key={href}
              href={href}
              className={r.pathname===href||r.pathname.startsWith(href+'/')?'active':''}
            >
              {label}
            </Link>
          ))}

          <button
            className="btn muted"
            onClick={()=>signOut(auth)}
            style={{marginTop:20,width:'100%'}}
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="main">
        {children}
      </main>
    </div>
  );
}