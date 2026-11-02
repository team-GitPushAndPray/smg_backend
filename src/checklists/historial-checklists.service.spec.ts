import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { HistorialChecklistsService } from './historial-checklists.service.js';

describe('HistorialChecklistsService', () => {
  let service: HistorialChecklistsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      equipo: {
        findUnique: vi.fn(),
      },
      checklist: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn((promises) => Promise.all(promises)),
    };

    service = new HistorialChecklistsService(prismaMock);
  });

  it('debe lanzar NotFoundException (404) si el equipo no existe', async () => {
    prismaMock.equipo.findUnique.mockResolvedValue(null);

    await expect(
      service.findAllByEquipo(999, { page: 1, limit: 20 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe devolver 200 y mapear cantidad_anormales, cantidad_fotos y tiene_observaciones', async () => {
    prismaMock.equipo.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.checklist.count.mockResolvedValue(1);
    prismaMock.checklist.findMany.mockResolvedValue([
      {
        id: 10,
        tipo: 'ENTREGA',
        fecha: new Date('2026-10-30T14:00:00.000Z'),
        horas_motor: 1250,
        responsable_nombre: 'Mauro',
        responsable_apellido: 'Barroso',
        observaciones: null,
        _count: {
          fotos: 2,
          respuestas: 1,
        },
        respuestas: [{ id: 101 }],
      },
    ]);

    const result = await service.findAllByEquipo(1, {
      page: 1,
      limit: 20,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      id: 10,
      tipo: 'ENTREGA',
      fecha: new Date('2026-10-30T14:00:00.000Z'),
      horas_motor: 1250,
      responsable_nombre: 'Mauro',
      responsable_apellido: 'Barroso',
      cantidad_anormales: 1,
      cantidad_fotos: 2,
      tiene_observaciones: true,
    });
  });

  it('debe construir filtro AND por cada palabra de responsable en nombre o apellido', async () => {
    prismaMock.equipo.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.checklist.count.mockResolvedValue(0);
    prismaMock.checklist.findMany.mockResolvedValue([]);

    await service.findAllByEquipo(1, {
      responsable: 'mauro barroso',
      page: 1,
      limit: 20,
    });

    const whereUsado = prismaMock.checklist.findMany.mock.calls[0][0].where;
    expect(whereUsado.AND).toHaveLength(3); // equipo_id + palabra "mauro" + palabra "barroso"
  });
});