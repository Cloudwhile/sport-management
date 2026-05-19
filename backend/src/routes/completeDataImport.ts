import express, { Router } from 'express';
import {
  cancelImportJob,
  getImportJobStatus,
  importPhysicalTests,
  previewPhysicalTests,
} from '../controllers/completeDataImportController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router: Router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/physical-tests/preview', upload.array('files', 10), previewPhysicalTests);
router.post('/physical-tests/import', upload.array('files', 10), importPhysicalTests);
router.get('/physical-tests/import/jobs/:jobId', getImportJobStatus);
router.post('/physical-tests/import/jobs/:jobId/cancel', cancelImportJob);

export default router;
