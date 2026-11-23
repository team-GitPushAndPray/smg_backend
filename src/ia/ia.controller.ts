import { BadRequestException, Body, Controller, HttpCode, HttpStatus, NotFoundException, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PruebaIaDto } from './dto/prueba-ia.dto.js';
import { GeminiService } from './gemini.service.js';

const MAX_PDF_BYTES = 4 * 1024 * 1024;

@Modulo('POSTULACIONES', { editar: true })
@Controller('ia')
export class IaController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /api/ia/prueba
   */
  @Modulo('POSTULACIONES', { editar: true })
  @Post('prueba')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: memoryStorage(),
      limits: {
        fileSize: 15 * 1024 * 1024,
      },
    }),
  )
  async probarAnalisis(
    @Body() dto: PruebaIaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('El archivo CV en PDF es obligatorio.');
    }

    if (file.size > MAX_PDF_BYTES) {
      throw new BadRequestException('El archivo CV no puede superar los 4 MB.');
    }

    const header = file.buffer.subarray(0, 4).toString('utf8');
    if (header !== '%PDF') {
      throw new BadRequestException('El archivo debe ser un PDF válido.');
    }

    const vacante = await this.prisma.vacante.findUnique({
      where: { id: dto.vacante_id },
      select: {
        titulo: true,
        descripcion: true,
        requisitos: true,
      },
    });

    if (!vacante) {
      throw new NotFoundException(
        `No se encontró la vacante con id ${dto.vacante_id}.`,
      );
    }

    return this.geminiService.analizarCv({
      pdf: file.buffer,
      vacante,
    });
  }
}