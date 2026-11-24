import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { formatCents } from '@/core/money';
import { Button, TotalDisplay } from '@/presentation/components/ui';

describe('componentes de interfaz', () => {
  it('muestra el total acumulado en euros', () => {
    render(<TotalDisplay cents={5321} />);
    expect(screen.getByText('Total acumulado')).toBeInTheDocument();
    expect(screen.getByText(/53,21/)).toBeInTheDocument();
    expect(formatCents(5321)).toContain('53,21');
  });

  it('deshabilita el botón mientras está ocupado', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} loading>Guardar</Button>);
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled();
  });
});
