import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PostulacionesService } from './postulaciones.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { CreatePostulacionDto } from './dto/index.js';

@Controller('postulaciones')
export class PostulacionesController {
  constructor(private readonly postulacionesService: PostulacionesService) {}


  /**
   * POST /api/postulaciones
   * Endpoint público en formato multipart/form-data 
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

}