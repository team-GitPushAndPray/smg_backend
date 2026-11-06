import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AvisosService } from './avisos.service.js';
import { CreateAvisoDto } from './dto/create-aviso.dto.js';
import { UpdateAvisoDto } from './dto/update-aviso.dto.js';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

}
