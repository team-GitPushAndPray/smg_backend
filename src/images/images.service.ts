import { BadGatewayException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'node:stream';

@Injectable()
export class ImagesService {

    private readonly logger = new Logger(ImagesService.name);

    constructor(private readonly configService: ConfigService) {
        const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

        if (!cloudName || !apiKey || !apiSecret) {
            this.logger.warn('Credenciales de Cloudinary incompletas en las variables de entorno');
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
        });
    }

    async subir(
        archivo: Express.Multer.File,
        carpeta: string,
    ): Promise<string> {
        if (!archivo?.buffer) throw new InternalServerErrorException('El archivo no contiene un buffer válido en memoria');

        return new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: carpeta,
                    resource_type: 'image',
                },
                (error, result?: UploadApiResponse) => {
                    if (error || !result?.secure_url) {
                        this.logger.error(
                            `Error al subir imágen a Cloudinary (carpeta: ${carpeta})`,
                            error,
                        );

                        return reject(
                            new BadGatewayException(
                                'No se pudieron subir las fotos al servicio de almacenamiento. Intente nuevamente'
                            ),
                        );
                    }
                    resolve(result.secure_url);
                },
            );

            Readable.from(archivo.buffer).pipe(uploadStream);
        });
    }

    async subirMultiples(
        archivos: Express.Multer.File[],
        carpeta: string,
    ) : Promise <string[]> {
        return Promise.all(
            archivos.map((archivo) => this.subir(archivo, carpeta)),
        );
    }

}
