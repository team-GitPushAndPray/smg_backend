import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { EstadoPostulacion, Prisma } from '@prisma/client';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePostulacionDto, FilterPostulacionesDto, UpdateEstadoPostulacionDto } from './dto/index.js';
import { PostulacionAdminEntity, PostulacionPublicaEntity } from './entities/postulacion.entity.js';
import { validarArchivoPdf } from './validators/pdf-file.validator.js';

@Injectable()
export class PostulacionesService {
  constructor(private readonly prisma: PrismaService) {
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
      },
    });

    return new PostulacionPublicaEntity(nuevaPostulacion);
  }


  /**
   * GET /api/postulaciones
   * Lista las postulaciones con filtros opcionales (vacante_id, estado),
   * ordenadas de la más nueva a la más vieja e incluyendo el título de la vacante.
   */
  async findAll(
    filters: FilterPostulacionesDto,
  ): Promise<PostulacionAdminEntity[]> {
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
      include: {
        vacante: {
          select: {
            id: true,
            titulo: true,
            activa: true,
          },
        },
      },
    });

    return postulaciones.map((item) => new PostulacionAdminEntity(item));
  }

  /**
   * GET /api/postulaciones/:id
   * Obtiene la ficha completa de una postulación (incluyendo cv_url y cv_nombre_original)
   */
  async findOne(id: number): Promise<PostulacionAdminEntity> {
    const postulacion = await this.prisma.postulacion.findUnique({
      where: { id },
      include: {
        vacante: {
          select: {
            id: true,
            titulo: true,
            activa: true,
          },
        },
      },
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
      include: {
        vacante: {
          select: {
            id: true,
            titulo: true,
            activa: true,
          },
        },
      },
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
}