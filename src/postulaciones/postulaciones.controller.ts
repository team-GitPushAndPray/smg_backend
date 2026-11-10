import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CreatePostulacionDto, FilterPostulacionesDto, UpdateEstadoPostulacionDto } from './dto/index.js';
import { PostulacionesService } from './postulaciones.service.js';

@Modulo('POSTULACIONES')
@Controller('postulaciones')
export class PostulacionesController {
  constructor(private readonly postulacionesService: PostulacionesService) {}

  /**
   * POST /api/postulaciones
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: memoryStorage(),
      limits: {
        fileSize: 15 * 1024 * 1024,
      },
    }),
  )
  create(
    @Body() createPostulacionDto: CreatePostulacionDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postulacionesService.createPublica(createPostulacionDto, file);
  }

  /**
   * GET /api/postulaciones
   */
  @Modulo('POSTULACIONES')
  @Get()
  findAll(@Query() filters: FilterPostulacionesDto) {
    return this.postulacionesService.findAll(filters);
  }

  /**
   * GET /api/postulaciones/:id
   */
  @Modulo('POSTULACIONES')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postulacionesService.findOne(id);
  }

  /**
   * PATCH /api/postulaciones/:id/estado
   */
  @Modulo('POSTULACIONES', { editar: true })
  @Patch(':id/estado')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstadoDto: UpdateEstadoPostulacionDto,
  ) {
    return this.postulacionesService.updateEstado(id, updateEstadoDto);
  }
}