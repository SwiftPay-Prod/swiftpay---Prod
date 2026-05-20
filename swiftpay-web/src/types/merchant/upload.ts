import { UploadFolder } from "../enums";

export interface UploadFileRequest {
  merchantId: string;
  file: File;
  folder: UploadFolder;
}



