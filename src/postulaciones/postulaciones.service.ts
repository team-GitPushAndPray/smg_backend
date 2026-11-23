import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EstadoAnalisis, EstadoPostulacion, Prisma } from '@prisma/client';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePostulacionDto, FilterPostulacionesDto, OrdenPostulaciones, UpdateEstadoPostulacionDto } from './dto/index.js';
import { PostulacionAdminEntity, PostulacionPublicaEntity } from './entities/postulacion.entity.js';
import { validarArchivoPdf } from './validators/pdf-file.validator.js';
import { PostulacionesAnalisisService } from './postulaciones-analisis.service.js';

const POSTULACION_ADMIN_INCLUDE = {
  vacante: {
    select: {
      id: true,
      titulo: true,
      activa: true,
      requisitos_actualizados_en: true,
    },
  },
  analisis: {
    select: {
      estado: true,
      puntaje: true,
      resumen_experiencia: true,
      justificacion: true,
      error_detalle: true,
      modelo: true,
      analizado_en: true,
    },
  },
} as const;

@Injectable()
export class PostulacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postulacionesAnalisisService: PostulacionesAnalisisService,
  ) {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
  }


  /**
   * POST /api/postulaciones
   * Recibe una postulación pública, evalúa el honeypot, valida el PDF y la vacante, sube el CV a Cloudinary y guarda el registro con estado NUEVO
   */
  async createPublica(
    dto: CreatePostulacionDto,
    file?: Express.Multer.File,
  ): Promise<PostulacionPublicaEntity> {
    if (dto.website && dto.website.length > 0) {
      return new PostulacionPublicaEntity({
        id: Math.floor(Math.random() * 9000) + 1000,
        vacante_id: dto.vacante_id,
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        telefono: dto.telefono,
        mensaje: dto.mensaje ?? null,
        cv_nombre_original: file?.originalname?.trim() || 'cv.pdf',
        estado: EstadoPostulacion.NUEVO,
        creado_en: new Date(),
      });
    }

    validarArchivoPdf(file);

    const vacante = await this.prisma.vacante.findUnique({
      where: { id: dto.vacante_id },
      select: { id: true, activa: true },
    });

    if (!vacante || !vacante.activa) {
      throw new BadRequestException(
        'La vacante seleccionada no existe o no se encuentra activa',
      );
    }

    const uploadResult = await this.subirPdfACloudinary(file.buffer);
    const nombreOriginalLimpio = file.originalname.trim();

    const nuevaPostulacion = await this.prisma.postulacion.create({
      data: {
        vacante_id: dto.vacante_id,
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        telefono: dto.telefono,
        mensaje: dto.mensaje ?? null,
        cv_url: uploadResult.secure_url,
        cv_nombre_original: nombreOriginalLimpio,
        estado: EstadoPostulacion.NUEVO,
        consentimiento_en: new Date(),
        analisis: {
          create: {},
        },
      },
    });

    await this.postulacionesAnalisisService.analizar(
      nuevaPostulacion.id,
      file.buffer,
    );

    return new PostulacionPublicaEntity(nuevaPostulacion);
  }


  /**
   * GET /api/postulaciones
   * Lista las postulaciones con filtros opcionales (vacante_id, estado) y orden por recientes o afinidad
   */
  async findAll(
    filters: FilterPostulacionesDto,
  ): Promise<PostulacionAdminEntity[]> {
    const esAfinidad = filters.orden === OrdenPostulaciones.AFINIDAD;

    if (esAfinidad && filters.vacante_id === undefined) {
      throw new BadRequestException(
        'Para ordenar por afinidad elegí una vacante.',
      );
    }

    const where: Prisma.PostulacionWhereInput = {};

    if (filters.vacante_id !== undefined) {
      where.vacante_id = filters.vacante_id;
    }

    if (filters.estado !== undefined) {
      where.estado = filters.estado;
    }

    const postulaciones = await this.prisma.postulacion.findMany({
      where,
      orderBy: { creado_en: 'desc' },
      include: POSTULACION_ADMIN_INCLUDE,
    });

    if (!esAfinidad) {
      return postulaciones.map((item) => new PostulacionAdminEntity(item));
    }

    const ordenadas = this.ordenarPorAfinidad(postulaciones);
    let posicionActual = 0;

    return ordenadas.map((item) => {
      const posicion =
        this.obtenerPuntajeValido(item.analisis) !== null
          ? ++posicionActual
          : null;

      return new PostulacionAdminEntity({
        ...item,
        posicion,
      });
    });
  }


  /**
   * GET /api/postulaciones/:id
   * Obtiene la ficha completa de una postulación
   */
  async findOne(id: number): Promise<PostulacionAdminEntity> {
    const postulacion = await this.prisma.postulacion.findUnique({
      where: { id },
      include: POSTULACION_ADMIN_INCLUDE,
    });

    if (!postulacion) {
      throw new NotFoundException(`La postulación con ID ${id} no existe`);
    }

    return new PostulacionAdminEntity(postulacion);
  }


  /**
   * PATCH /api/postulaciones/:id/estado
   * Actualiza únicamente el estado de una postulación existente
   */
  async updateEstado(
    id: number,
    dto: UpdateEstadoPostulacionDto,
  ): Promise<PostulacionAdminEntity> {
    await this.findOne(id);

    const actualizada = await this.prisma.postulacion.update({
      where: { id },
      data: {
        estado: dto.estado,
      },
      include: POSTULACION_ADMIN_INCLUDE,
    });

    return new PostulacionAdminEntity(actualizada);
  }

  /**
   * Sube el buffer del PDF a Cloudinary
   */
  private subirPdfACloudinary(buffer: Buffer): Promise<UploadApiResponse> {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'postulaciones',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException(
                'No se pudo almacenar el archivo CV en el servidor de archivos',
              ),
            );
          }
          resolve(result);
        },
      );

      uploadStream.end(buffer);
    });
  }


  // Métodos privados

  private obtenerPuntajeValido(
    analisis: { estado: EstadoAnalisis; puntaje: number | null } | null,
  ): number | null {
    if (
      analisis?.estado === EstadoAnalisis.COMPLETADO &&
      typeof analisis.puntaje === 'number'
    ) {
      return analisis.puntaje;
    }

    return null;
  }

  private ordenarPorAfinidad<
    T extends {
      creado_en: Date;
      analisis: { estado: EstadoAnalisis; puntaje: number | null } | null;
    },
  >(postulaciones: T[]): T[] {
    return [...postulaciones].sort((a, b) => {
      const puntajeA = this.obtenerPuntajeValido(a.analisis);
      const puntajeB = this.obtenerPuntajeValido(b.analisis);

      if (puntajeA !== null && puntajeB === null) return -1;
      if (puntajeA === null && puntajeB !== null) return 1;

      if (puntajeA !== null && puntajeB !== null && puntajeA !== puntajeB) {
        return puntajeB - puntajeA;
      }

      return a.creado_en.getTime() - b.creado_en.getTime();
    });
  }

}