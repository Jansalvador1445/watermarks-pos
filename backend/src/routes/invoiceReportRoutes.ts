import { Router } from 'express';
import { getInvoiceSummaryReport, getInvoiceOutstandingReport } from '../controllers/invoiceReportController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = Router();

router.use(authenticate);
router.get('/summary', authorize('reports:read', 'dashboard:read'), getInvoiceSummaryReport);
router.get('/outstanding', authorize('reports:read', 'dashboard:read'), getInvoiceOutstandingReport);

export default router;
