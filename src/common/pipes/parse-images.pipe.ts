import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";


export interface ParseImagesOptions {
    min?: number;
    max?: number;
    maxSizeBytes?: number;
    allowedMimeTypes?: string[];
}

const DEFAULT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_SIZE_BYTES = 1.5 * 1024 * 1024;

@Injectable()
export class ParseImagesPipe implements PipeTransform<Express.Multer.File[], Express.Multer.File[]> {

    private readonly min: number;
    private readonly max: number;
    private readonly maxSizeBytes: number;
    private readonly allowedMimeTypes: string[];

    constructor(options: ParseImagesOptions = {}) {
        this.min = options.min ?? 1;
        this.max = options.max ?? 4;
        this.maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
        this.allowedMimeTypes = options.allowedMimeTypes ?? DEFAULT_MIME_TYPES;
    }

    transform(files: Express.Multer.File[]): Express.Multer.File[] {

        if (!files || !Array.isArray(files) || files.length < this.min) {
            throw new BadRequestException(
                this.min === 1
                    ? 'Debe adjuntar al menos una foto'
                    : `Debe adjuntar al menos ${this.min} fotos`,
            );
        }

        if (files.length > this.max) throw new BadRequestException(`Se permite adjuntar un máximo de ${this.max} fotos (se recibieron ${files.length})`);

        const maxMb = (this.maxSizeBytes / (1024 * 1024)).toFixed(1);

        for (const file of files) {
            if (!this.allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException(
                    `El archivo "${file.originalname}" tiene un formato no válido (${file.mimetype}). Solo se permiten imágenes JPEG, PNG o WEBP`,
                );
            }

            if (file.size > this.maxSizeBytes) {
                throw new BadRequestException(
                    `La foto "${file.originalname}" supera el tamaño máximo permitido de ${maxMb} MB`,
                );
            }
        }

        return files;
    }
}