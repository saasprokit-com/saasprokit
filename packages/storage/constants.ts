import {
  ALLOWED_IMAGE_TYPES,
  type AllowedImageType,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB,
} from "@repo/utils/storage";
import { z } from "zod";

export const imageFileSchema = z
  .instanceof(File, { message: "Please upload a valid image file." })
  .refine(
    (file) => ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType),
    {
      message: "Please upload a JPEG, PNG, WebP, or GIF image.",
      path: ["type"],
    }
  )
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: `Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
    path: ["size"],
  });
