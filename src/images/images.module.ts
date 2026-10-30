import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImagesService } from './images.service.js';

@Module({
  imports: [ConfigModule],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}