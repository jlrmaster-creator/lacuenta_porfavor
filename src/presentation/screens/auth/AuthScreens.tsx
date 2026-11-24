import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Coffee } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage } from '@/core/errors';
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/domain/services/validators';
import { authRepository } from '@/state/repositories';
import { useAuthStore } from '@/state/stores';
import { Button, Card, Field } from '@/presentation/components/ui';
import type { z } from 'zod';

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ResetForm = z.infer<typeof resetPasswordSchema>;

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="auth-logo">
        <Coffee size={44} color="var(--primary)" />
        <h1>La Cuenta Por Favor</h1>
        <p className="muted">{subtitle}</p>
      </div>
      <Card>
        <h2 className="card-title">{title}</h2>
        {children}
      </Card>
    </div>
  );
}

export function LoginScreen() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const [error, setError] = useState('');
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const submit = handleSubmit(async (data) => {
    setError('');
    try {
      setUser(await authRepository.signIn(data.email, data.password));
      navigate('/');
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthShell title="Iniciar sesión" subtitle="Tus consumiciones, siempre a mano">
      <form onSubmit={submit} noValidate>
        <Field label="Correo electrónico" error={errors.email?.message}>
          <input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <input type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        {error ? <div className="banner">{error}</div> : null}
        <Button type="submit" block size="lg" loading={isSubmitting} className="mt-1">Entrar</Button>
      </form>
      <div className="divider" />
      <div className="column small">
        <Link to="/reset" className="right">¿Olvidaste tu contraseña?</Link>
        <p className="muted center">¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Regístrate</Link></p>
      </div>
    </AuthShell>
  );
}

export function RegisterScreen() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const [error, setError] = useState('');
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const submit = handleSubmit(async (data) => {
    setError('');
    try {
      setUser(await authRepository.signUp(data.email, data.password, data.displayName));
      navigate('/');
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthShell title="Crear cuenta" subtitle="Empieza a controlar lo que consumas">
      <form onSubmit={submit} noValidate>
        <Field label="Nombre visible" error={errors.displayName?.message}>
          <input autoComplete="name" {...register('displayName')} />
        </Field>
        <Field label="Correo electrónico" error={errors.email?.message}>
          <input type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        {error ? <div className="banner">{error}</div> : null}
        <Button type="submit" block size="lg" loading={isSubmitting} className="mt-1">Crear cuenta</Button>
      </form>
      <div className="divider" />
      <p className="muted center small">¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Inicia sesión</Link></p>
    </AuthShell>
  );
}

export function ResetPasswordScreen() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetForm>({ resolver: zodResolver(resetPasswordSchema) });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = handleSubmit(async (data) => {
    setError('');
    try {
      await authRepository.sendPasswordReset(data.email);
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviaremos un correo para restablecerla">
      {sent ? (
        <div>
          <p>Revisa tu correo y sigue las instrucciones para elegir una contraseña nueva.</p>
          <Link to="/login"><Button block className="mt-2">Volver a iniciar sesión</Button></Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <Field label="Correo electrónico" error={errors.email?.message}>
            <input type="email" autoComplete="email" {...register('email')} />
          </Field>
          {error ? <div className="banner">{error}</div> : null}
          <Button type="submit" block loading={isSubmitting} className="mt-1">Enviar correo</Button>
          <Link to="/login"><Button variant="secondary" block className="mt-1">Cancelar</Button></Link>
        </form>
      )}
    </AuthShell>
  );
}
