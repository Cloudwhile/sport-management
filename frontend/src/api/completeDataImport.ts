import http from '@/utils/http'

export interface CompleteDataImportOptions {
  formName: string
  academicYear: string
  participatingCohorts: string
  sheetSelections?: Array<{
    fileName: string
    rawSheetName?: string
    analysisSheetName?: string
  }>
}

export interface CompleteDataImportRequestOptions {
  signal?: AbortSignal
  onUploadProgress?: (payload: {
    progress: number
    loaded: number
    total: number
    rate?: number
    estimated?: number
  }) => void
}

export interface CompleteDataImportPreviewFile {
  fileName: string
  sheetNames: string[]
  rawSheetName: string
  analysisSheetName?: string
  totalRows: number
  classCount: number
  studentCount: number
  duplicateStudentIds: string[]
  warnings: string[]
  issues: Array<{
    row: number
    message: string
  }>
}

export interface CompleteDataImportPreview {
  form: CompleteDataImportOptions
  files: CompleteDataImportPreviewFile[]
  totals: {
    rows: number
    students: number
    classes: number
    issues: number
  }
}

export interface CompleteDataImportResult {
  formId: number
  files: string[]
  rows: number
  studentsCreated: number
  studentsUpdated: number
  classesCreated: number
  relationsUpserted: number
  recordsCreated: number
  recordsUpdated: number
  failed: number
  warnings: Array<{
    fileName: string
    row?: number
    message: string
  }>
  errors: Array<{
    fileName: string
    row: number
    message: string
  }>
}

export type CompleteDataImportJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'canceling'
  | 'canceled'

export interface CompleteDataImportJob {
  id: string
  status: CompleteDataImportJobStatus
  phase: 'queued' | 'importing' | 'completed' | 'failed' | 'canceled'
  files: string[]
  fileProgresses: Array<{
    fileName: string
    totalRows: number
    processedRows: number
    progress: number
  }>
  totalRows: number
  processedRows: number
  progress: number
  startedAt: string
  updatedAt: string
  completedAt?: string
  estimatedSecondsRemaining: number | null
  currentFileName?: string
  currentRow?: number
  message: string
  result?: CompleteDataImportResult
  error?: string
}

const buildFormData = (files: File[], options: CompleteDataImportOptions) => {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  formData.append('formName', options.formName)
  formData.append('academicYear', options.academicYear)
  formData.append('participatingCohorts', options.participatingCohorts)
  if (options.sheetSelections) {
    formData.append('sheetSelections', JSON.stringify(options.sheetSelections))
  }
  return formData
}

const buildAsyncImportFormData = (files: File[], options: CompleteDataImportOptions) => {
  const formData = buildFormData(files, options)
  formData.append('asyncImport', 'true')
  return formData
}

const createUploadProgressHandler = (requestOptions?: CompleteDataImportRequestOptions) => {
  return (event: any) => {
    if (event.total && requestOptions?.onUploadProgress) {
      requestOptions.onUploadProgress({
        progress: Math.round((event.loaded / event.total) * 100),
        loaded: event.loaded,
        total: event.total,
        rate: event.rate,
        estimated: event.estimated
      })
    }
  }
}

const completeDataImportAPI = {
  previewPhysicalTests(
    files: File[],
    options: CompleteDataImportOptions,
    requestOptions?: CompleteDataImportRequestOptions
  ): Promise<CompleteDataImportPreview> {
    return http.post('/complete-data-import/physical-tests/preview', buildFormData(files, options), {
      timeout: 0,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      signal: requestOptions?.signal,
      onUploadProgress: createUploadProgressHandler(requestOptions)
    })
  },

  importPhysicalTests(
    files: File[],
    options: CompleteDataImportOptions,
    requestOptions?: CompleteDataImportRequestOptions
  ): Promise<CompleteDataImportResult> {
    return http.post('/complete-data-import/physical-tests/import', buildFormData(files, options), {
      timeout: 0,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      signal: requestOptions?.signal,
      onUploadProgress: createUploadProgressHandler(requestOptions)
    })
  },

  startImportPhysicalTests(
    files: File[],
    options: CompleteDataImportOptions,
    requestOptions?: CompleteDataImportRequestOptions
  ): Promise<CompleteDataImportJob> {
    return http.post('/complete-data-import/physical-tests/import', buildAsyncImportFormData(files, options), {
      timeout: 0,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      signal: requestOptions?.signal,
      onUploadProgress: createUploadProgressHandler(requestOptions)
    })
  },

  getImportJob(jobId: string): Promise<CompleteDataImportJob> {
    return http.get(`/complete-data-import/physical-tests/import/jobs/${jobId}`)
  },

  cancelImportJob(jobId: string): Promise<CompleteDataImportJob> {
    return http.post(`/complete-data-import/physical-tests/import/jobs/${jobId}/cancel`)
  }
}

export default completeDataImportAPI
