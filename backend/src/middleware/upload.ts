import multer from 'multer';

// 使用内存存储
const storage = multer.memoryStorage();

// 文件过滤器 - 只允许 Excel 文件
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 .xlsx 和 .xls 格式的 Excel 文件'));
  }
};

// 配置 multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制文件大小为 5MB
  },
});
