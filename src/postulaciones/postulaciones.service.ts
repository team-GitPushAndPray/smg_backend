import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { CreatePostulacionDto } from './dto/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PostulacionPublicaEntity } from './entities/postulacion.entity.js';
import { EstadoPostulacion } from '@prisma/client';
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
   * Recibe una postulación pública, evalúia el honeypot, valida el PDF y la vacante, sube el CV a Cloudinary y guarda el registro con estado NUEVO
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

    if (!vacante || !vacante.activa) throw new BadRequestException('La vacante seleccionada no existe o no se encuentra activa');

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
      }
    })

    return new PostulacionPublicaEntity(nuevaPostulacion);
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
            const detalle = error?.message || JSON.stringify(error) || 'Respuesta vacía de Cloudinary';
            return reject(
              new InternalServerErrorException(
                `Error Cloudinary: ${detalle}`,
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