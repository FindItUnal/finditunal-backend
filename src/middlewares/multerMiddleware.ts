import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

export const UPLOADS_BASE_PATH = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
const MAX_FILE_SIZE_MB = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || '20');
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILES = Number(process.env.UPLOAD_MAX_FILES || '4');

const ensureUploadsDirExists = (): void => {
  if (!fs.existsSync(UPLOADS_BASE_PATH)) {
    fs.mkdirSync(UPLOADS_BASE_PATH, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    ensureUploadsDirExists();
    cb(null, UPLOADS_BASE_PATH);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'));
  }
};

export const deleteImage = (imagePath: string): void => {
  const fullPath = path.join(UPLOADS_BASE_PATH, imagePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error(`Error al eliminar la imagen ${imagePath}:`, err);
    }
  });
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES,
  },
});

export default upload;
