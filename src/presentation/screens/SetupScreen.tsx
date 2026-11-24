import { Coffee, Settings2 } from 'lucide-react';
import { Card } from '@/presentation/components/ui';

export function SetupScreen() {
  return (
    <div className="auth-wrap">
      <div className="auth-logo">
        <Coffee size={44} color="var(--primary)" />
        <h1>La Cuenta Por Favor</h1>
      </div>
      <Card>
        <div className="row"><Settings2 size={20} /><h2 className="card-title" style={{ margin: 0 }}>Configuración de Firebase pendiente</h2></div>
        <p>La aplicación no incluye credenciales. Para conectarla a tu proyecto:</p>
        <ol>
          <li>Copia <code>.env.example</code> a <code>.env.local</code>.</li>
          <li>Rellena los seis valores con la configuración web oficial de tu proyecto Firebase.</li>
          <li>Despliega <code>firestore.rules</code> y <code>firestore.indexes.json</code>.</li>
          <li>Reinicia <code>npm run dev</code>.</li>
        </ol>
        <p className="muted small">Consulta <code>docs/firebase-setup.md</code> para el paso a paso. No compartas nunca claves privadas de cuenta de servicio.</p>
      </Card>
    </div>
  );
}
