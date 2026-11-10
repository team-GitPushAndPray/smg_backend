import { BadRequestException, PayloadTooLargeException } from "@nestjs/common";

export const MAX_CV_SIZE_BYTES = 4 * 1024 * 1024;
const PDF_MAGIC_HEADER = '%PDF';

export function validarArchivoPdf(file?: Express.Multer.File): asserts file is Express.Multer.File {

    if (!file || !file.buffer || file.buffer.length === 0) throw new BadRequestException('El archivo del CV es obligatorio y no puede estar vacío');

    if (file.size > MAX_CV_SIZE_BYTES) throw new PayloadTooLargeException('El archivo CV supera el máximo permitido de 4 MB');

    if (file.buffer.length < 4) throw new BadRequestException('El archivo adjunto no es un PDF válido');

    const primerosBytes = file.buffer.subarray(0, 4).toString('ascii');

    if (primerosBytes !== PDF_MAGIC_HEADER) throw new BadRequestException(`El archivo adjunto debe ser un documento PDF real (cabecera binaria inválida)`);

}